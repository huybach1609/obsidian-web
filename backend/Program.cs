using backend.Exceptions;
using backend.Extentions;
using Markdig;
using Microsoft.IdentityModel.Tokens;
using System.Text;

#region setup app
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

var VAULT_ROOT = builder.Configuration["Vault:Root"] ?? builder.Configuration["VAULT_ROOT"] ?? "/vault";
Console.WriteLine($"Root path: {VAULT_ROOT}");
var jwtKey = builder.Configuration["JWT_SECRET"] ??
throw new EmptyConfigurationValueException("JWT_SECRET is not configured in environment variables.");

var username = builder.Configuration["credential:username"] ??
throw new EmptyConfigurationValueException("credential__username is not configured in environment variables.");

var password = builder.Configuration["credential:password"] ??
throw new EmptyConfigurationValueException("credential__password is not configured in environment variables.");


builder.Services.AddAppCore(builder.Configuration);
builder.Services.AddAuthentication(builder.Configuration, jwtKey);


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(b => b.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

#endregion


#region api endpoints
// Helpers
string SafePath(string relative)
{
    if (string.IsNullOrEmpty(relative) || relative == "/") return Path.GetFullPath(VAULT_ROOT);
    // Prevent absolute paths from client
    var candidate = Path.GetFullPath(Path.Combine(VAULT_ROOT, relative.TrimStart('/', '\\')));
    if (!candidate.StartsWith(Path.GetFullPath(VAULT_ROOT))) throw new UnauthorizedAccessException("Invalid path");
    return candidate;
}

// Simple login (demo only) - replace with real user store
app.MapPost("/api/login", (LoginRequest req) =>
{
    if (req.Username == username && req.Password == password)
    {
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(jwtKey);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Results.Ok(new { token = tokenHandler.WriteToken(token) });
    }
    return Results.Unauthorized();
});

// List directory (existing endpoint - works for folders)
app.MapGet("/api/tree", (string? path) =>
{
    var full = SafePath(path ?? "/");
    if (!Directory.Exists(full)) return Results.Ok(new object[0]);
    var entries = Directory.EnumerateFileSystemEntries(full)
        .Select(p => new
        {
            name = Path.GetFileName(p),
            path = Path.GetRelativePath(VAULT_ROOT, p).Replace("\\", "/"),
            isDir = Directory.Exists(p)
        });
    return Results.Ok(entries);
}).RequireAuthorization();

// NEW: Explicit folder endpoint (alias for /api/tree for clarity)
app.MapGet("/api/folder", (string? path) =>
{
    var full = SafePath(path ?? "/");
    if (!Directory.Exists(full))
        return Results.NotFound(new { error = "Folder not found" });

    var entries = Directory.EnumerateFileSystemEntries(full)
        .Select(p => new
        {
            name = Path.GetFileName(p),
            path = Path.GetRelativePath(VAULT_ROOT, p).Replace("\\", "/"),
            isDir = Directory.Exists(p),
            type = Directory.Exists(p) ? "folder" : "file",
            extension = Directory.Exists(p) ? null : Path.GetExtension(p)
        })
        .OrderBy(e => !e.isDir) // folders first
        .ThenBy(e => e.name);

    return Results.Ok(new
    {
        path = path ?? "/",
        fullPath = full,
        items = entries
    });
}).RequireAuthorization();

// Read file
app.MapGet("/api/file", async (string path) =>
{
    var full = SafePath(path);

    // Check if it's a directory instead of a file
    if (Directory.Exists(full))
        return Results.BadRequest(new { error = "Path is a directory, use /api/folder or /api/tree instead" });

    if (!System.IO.File.Exists(full))
        return Results.NotFound(new { error = "File not found" });

    var content = await System.IO.File.ReadAllTextAsync(full);
    return Results.Ok(new { content, path });
}).RequireAuthorization();

// Write file (atomic)
app.MapPut("/api/file", async (FileWrite req) =>
{
    var full = SafePath(req.Path);
    Directory.CreateDirectory(Path.GetDirectoryName(full)!);
    // atomic write using temp file then move
    var tmp = full + ".tmp";
    await System.IO.File.WriteAllTextAsync(tmp, req.Content ?? string.Empty, Encoding.UTF8);
    System.IO.File.Move(tmp, full, true);
    return Results.Ok(new { ok = true });
}).RequireAuthorization();

// NEW: Create folder
app.MapPost("/api/folder", (FolderCreate req) =>
{
    var full = SafePath(req.Path);
    if (Directory.Exists(full))
        return Results.Conflict(new { error = "Folder already exists" });

    Directory.CreateDirectory(full);
    return Results.Ok(new { ok = true, path = req.Path });
}).RequireAuthorization();

// Render preview server-side
app.MapGet("/api/preview", (string path) =>
{
    var full = SafePath(path);
    if (!System.IO.File.Exists(full)) return Results.NotFound();
    var md = System.IO.File.ReadAllText(full);
    var pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
    var html = Markdig.Markdown.ToHtml(md, pipeline);
    return Results.Text(html, "text/html");
}).RequireAuthorization();
#endregion

app.Run();
record LoginRequest(string Username, string Password);
record FileWrite(string Path, string Content);
record FolderCreate(string Path);