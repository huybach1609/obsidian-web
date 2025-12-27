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
        /// <summary>
        ///  Get list info of file/folder by path, optionally including nested children (tree) up to a given depth.
        /// </summary>
        /// <param name="path">Folder path relative to vault root.</param>
        /// <param name="depth">
        /// Maximum depth of the tree to load (1 = only this folder, 2 = this folder + its children, etc.).
        /// Defaults to 1 to preserve existing behaviour.
        /// </param>
        /// <returns></returns>
        [HttpGet("tree")]
        public IActionResult GetTree([FromQuery] string? path, [FromQuery] int depth = 1)
        {
            var full = SafePath(path ?? "/");

            if (!Directory.Exists(full))
                return Ok(Array.Empty<object>());

            // Clamp depth to a sensible minimum to avoid invalid values
            if (depth < 1)
            {
                depth = 1;
            }

            var entries = EnumerateTree(full, depth);

            return Ok(entries);
        }

        /// <summary>
        /// Recursively enumerate a folder into a simple tree structure up to the specified depth.
        /// </summary>
        private IEnumerable<TreeEntry> EnumerateTree(string directoryFullPath, int depth)
        {
            foreach (var p in Directory.EnumerateFileSystemEntries(directoryFullPath))
            {
                var isDir = Directory.Exists(p);
                var relativePath = Path.GetRelativePath(_vaultRoot, p).Replace("\\", "/");

                var entry = new TreeEntry
                {
                    name = Path.GetFileName(p),
                    path = relativePath,
                    isDir = isDir
                };

                // If this is a directory and we still have depth remaining, load children
                if (isDir && depth > 1)
                {
                    entry.children = EnumerateTree(p, depth - 1).ToList();
                }

                yield return entry;
            }
        }

        // GET /api/folder
        /// <summary>
        /// 
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
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
        /// <summary>
        /// get detail md text file in side 
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
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

        // POST /api/file
        [HttpPost("file")]
        public async Task<IActionResult> PostFile([FromBody] FileWrite req)
        {
            var full = SafePath(req.Path);

            // Ensure the file has .md extension
            if (!full.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            {
                full += ".md";
            }

            // Check if file already exists
            if (System.IO.File.Exists(full))
            {
                return Conflict(new { error = "File already exists" });
            }

            Directory.CreateDirectory(Path.GetDirectoryName(full)!);

            // atomic write using temp file then move
            var tmp = full + ".tmp";
            await System.IO.File.WriteAllTextAsync(tmp, req.Content ?? string.Empty, Encoding.UTF8);
            System.IO.File.Move(tmp, full, true);

            return Ok(new { ok = true, path = Path.GetRelativePath(_vaultRoot, full).Replace("\\", "/") });
        }

        // POST /api/file/rename
        /// <summary>
        /// Rename a file or folder
        /// </summary>
        /// <param name="req"></param>
        /// <returns></returns>
        [HttpPost("file/rename")]
        public IActionResult RenameFileOrFolder([FromBody] RenameRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.OldPath) || string.IsNullOrWhiteSpace(req.NewPath))
            {
                return BadRequest(new { error = "OldPath and NewPath are required" });
            }

            var oldFull = SafePath(req.OldPath);
            var newFull = SafePath(req.NewPath);

            if (!System.IO.File.Exists(oldFull) && !Directory.Exists(oldFull))
            {
                return NotFound(new { error = "Source file or folder not found" });
            }

            try
            {
                var newDir = Path.GetDirectoryName(newFull);
                if (!string.IsNullOrEmpty(newDir))
                {
                    Directory.CreateDirectory(newDir);
                }

                if (Directory.Exists(oldFull))
                {
                    Directory.Move(oldFull, newFull);
                }
                else
                {
                    System.IO.File.Move(oldFull, newFull);
                }

                return Ok(new { ok = true, oldPath = req.OldPath, newPath = req.NewPath });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to rename: {ex.Message}" });
            }
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

        // DELETE /api/file
        /// <summary>
        /// Delete a file or folder by path
        /// </summary>
        /// <param name="path"></param>
        /// <returns></returns>
        [HttpDelete("file")]
        public IActionResult DeleteFile([FromQuery] string path)
        {
            var full = SafePath(path);

            if (!System.IO.File.Exists(full) && !Directory.Exists(full))
                return NotFound(new { error = "File or folder not found" });

            try
            {
                if (Directory.Exists(full))
                {
                    Directory.Delete(full, recursive: true);
                }
                else
                {
                    System.IO.File.Delete(full);
                }

                return Ok(new { ok = true, path = path });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to delete: {ex.Message}" });
            }
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

        //// Use IMemoryCache to save the list file, avoid scanning the disk every time calling the API
        //[HttpGet("file-index")]
        //public IActionResult GetFileIndex()
        //{
        //    // Key cache
        //    string cacheKey = "vault_file_index";

        //    if (!_cache.TryGetValue(cacheKey, out List<FileIndexDto> fileList))
        //    {
        //        // If not in cache, scan directory
        //        var rootPath = _vaultRoot;
        //        var files = Directory.GetFiles(rootPath, "*.md", SearchOption.AllDirectories);

        //        fileList = files.Select(f => new FileIndexDto
        //        {
        //            FileName = Path.GetFileNameWithoutExtension(f),
        //            FilePath = Path.GetRelativePath(rootPath, f)
        //        }).ToList();

        //        _cache.Set(cacheKey, fileList, TimeSpan.FromMinutes(10));
        //    }
        //    Console.WriteLine(fileList);
            

        //    return Ok(fileList);
        //}
        [HttpGet("file-index")]
        public async Task<IActionResult> GetFileIndex()
        {
            string cacheKey = "vault_file_index";

            if (!_cache.TryGetValue(cacheKey, out List<FileIndexDto> fileList))
            {
                var rootPath = _vaultRoot;

                // Move heavy work off the request thread
                fileList = await Task.Run(() =>
                {
                    var files = Directory.GetFiles(rootPath, "*.md", SearchOption.AllDirectories);

                    return files.Select(f => new FileIndexDto
                    {
                        FileName = Path.GetFileNameWithoutExtension(f),
                        FilePath = Path.GetRelativePath(rootPath, f)
                    }).ToList();
                });

                _cache.Set(cacheKey, fileList, TimeSpan.FromMinutes(10));
            }

            Console.WriteLine(fileList);

            return Ok(fileList);
        }



    }
    public class RenameRequest
    {
        public string OldPath { get; set; }
        public string NewPath { get; set; }
    }
    public class TreeEntry
    {
        public string name { get; set; }
        public string path { get; set; }
        public bool isDir { get; set; }
        public List<TreeEntry>? children { get; set; }
    }
    public class FileIndexDto
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }
}


