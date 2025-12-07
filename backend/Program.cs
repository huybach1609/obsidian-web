using backend.Exceptions;
using backend.Extentions;
using Markdig;
using Microsoft.IdentityModel.Tokens;
using System.Text;

#region setup app
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

var VAULT_ROOT = builder.Configuration["Vault:Root"] ?? builder.Configuration["VAULT_ROOT"] ??
    throw new EmptyConfigurationValueException("Vault_root is not configured in environment variables.");
;
var jwtKey = builder.Configuration["JWT_SECRET"] ??
throw new EmptyConfigurationValueException("JWT_SECRET is not configured in environment variables.");

var username = builder.Configuration["credential:username"] ??
throw new EmptyConfigurationValueException("credential__username is not configured in environment variables.");

var password = builder.Configuration["credential:password"] ??
throw new EmptyConfigurationValueException("credential__password is not configured in environment variables.");

Console.WriteLine($"Root path: {VAULT_ROOT}");
Console.WriteLine($"JWT Key: {jwtKey}");
Console.WriteLine($"Username: {username}");
Console.WriteLine($"Password: {password}");

builder.Services.AddAppCore(builder.Configuration);
builder.Services.AddAuthentication(builder.Configuration, jwtKey);
builder.Services.AddHealthChecks();


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
app.MapHealthChecks("/health");

#endregion

app.Run();

public record LoginRequest(string Username, string Password);
public record FileWrite(string Path, string Content);
public record FolderCreate(string Path);

