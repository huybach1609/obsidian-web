using Markdig;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly string _vaultRoot;
        private readonly IMemoryCache _cache;

        public FilesController(IConfiguration configuration, IMemoryCache cache)
        {
            _vaultRoot = configuration["Vault:Root"]
                         ?? configuration["VAULT_ROOT"]
                         ?? "/vault";
            _cache = cache;
        }

        private string SafePath(string relative)
        {
            if (string.IsNullOrEmpty(relative) || relative == "/")
                return Path.GetFullPath(_vaultRoot);

            // Prevent absolute paths from client
            var candidate = Path.GetFullPath(Path.Combine(_vaultRoot, relative.TrimStart('/', '\\')));

            if (!candidate.StartsWith(Path.GetFullPath(_vaultRoot)))
                throw new UnauthorizedAccessException("Invalid path");

            return candidate;
        }

        // GET /api/tree
        [HttpGet("tree")]
        public IActionResult GetTree([FromQuery] string? path)
        {
            var full = SafePath(path ?? "/");

            if (!Directory.Exists(full))
                return Ok(Array.Empty<object>());

            var entries = Directory.EnumerateFileSystemEntries(full)
                .Select(p => new
                {
                    name = Path.GetFileName(p),
                    path = Path.GetRelativePath(_vaultRoot, p).Replace("\\", "/"),
                    isDir = Directory.Exists(p)
                });

            return Ok(entries);
        }

        // GET /api/folder
        [HttpGet("folder")]
        public IActionResult GetFolder([FromQuery] string? path)
        {
            var full = SafePath(path ?? "/");

            if (!Directory.Exists(full))
                return NotFound(new { error = "Folder not found" });

            var entries = Directory.EnumerateFileSystemEntries(full)
                .Select(p => new
                {
                    name = Path.GetFileName(p),
                    path = Path.GetRelativePath(_vaultRoot, p).Replace("\\", "/"),
                    isDir = Directory.Exists(p),
                    type = Directory.Exists(p) ? "folder" : "file",
                    extension = Directory.Exists(p) ? null : Path.GetExtension(p)
                })
                .OrderBy(e => !e.isDir) // folders first
                .ThenBy(e => e.name);

            return Ok(new
            {
                path = path ?? "/",
                fullPath = full,
                items = entries
            });
        }

        // GET /api/file
        [HttpGet("file")]
        public async Task<IActionResult> GetFile([FromQuery] string path)
        {
            var full = SafePath(path);

            // Check if it's a directory instead of a file
            if (Directory.Exists(full))
                return BadRequest(new { error = "Path is a directory, use /api/folder or /api/tree instead" });

            if (!System.IO.File.Exists(full))
                return NotFound(new { error = "File not found" });

            var content = await System.IO.File.ReadAllTextAsync(full);
            return Ok(new { content, path });
        }

        // PUT /api/file
        [HttpPut("file")]
        public async Task<IActionResult> PutFile([FromBody] FileWrite req)
        {
            var full = SafePath(req.Path);

            Directory.CreateDirectory(Path.GetDirectoryName(full)!);

            // atomic write using temp file then move
            var tmp = full + ".tmp";
            await System.IO.File.WriteAllTextAsync(tmp, req.Content ?? string.Empty, Encoding.UTF8);
            System.IO.File.Move(tmp, full, true);

            return Ok(new { ok = true });
        }

        // POST /api/folder
        [HttpPost("folder")]
        public IActionResult CreateFolder([FromBody] FolderCreate req)
        {
            var full = SafePath(req.Path);

            if (Directory.Exists(full))
                return Conflict(new { error = "Folder already exists" });

            Directory.CreateDirectory(full);

            return Ok(new { ok = true, path = req.Path });
        }

        // GET /api/preview
        [HttpGet("preview")]
        public IActionResult Preview([FromQuery] string path)
        {
            var full = SafePath(path);

            if (!System.IO.File.Exists(full))
                return NotFound();

            var md = System.IO.File.ReadAllText(full);
            var pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
            var html = Markdown.ToHtml(md, pipeline);
            var wrapped = $"<div class=\"markdown-body\">{html}</div>";

            return Content(wrapped, "text/html");
        }

        // GET /api/files/search
        [HttpGet("files/search")]
        public IActionResult Search([FromQuery] string q)
        {
            var full = SafePath(q);

            if (!System.IO.File.Exists(full))
                return NotFound();

            var md = System.IO.File.ReadAllText(full);
            var pipeline = new MarkdownPipelineBuilder().UseAdvancedExtensions().Build();
            var html = Markdown.ToHtml(md, pipeline);
            var wrapped = $"<div class=\"markdown-body\">{html}</div>";

            return Content(wrapped, "text/html");
        }

        // Use IMemoryCache to save the list file, avoid scanning the disk every time calling the API
        [HttpGet("file-index")]
        public IActionResult GetFileIndex()
        {
            // Key cache
            string cacheKey = "vault_file_index";

            if (!_cache.TryGetValue(cacheKey, out List<FileIndexDto> fileList))
            {
                // If not in cache, scan directory
                var rootPath = _vaultRoot;
                var files = Directory.GetFiles(rootPath, "*.md", SearchOption.AllDirectories);

                fileList = files.Select(f => new FileIndexDto
                {
                    FileName = Path.GetFileNameWithoutExtension(f),
                    FilePath = Path.GetRelativePath(rootPath, f)
                }).ToList();

                _cache.Set(cacheKey, fileList, TimeSpan.FromMinutes(10));
            }

            return Ok(fileList);
        }


    }
    public class FileIndexDto
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }
}


