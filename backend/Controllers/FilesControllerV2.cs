using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    /// <summary>
    /// V2 Files API: returns raw markdown to the client instead of HTML (no Markdig).
    /// Client is responsible for rendering markdown (e.g. in the browser).
    /// </summary>
    [ApiController]
    [Route("api/v2")]
    [Authorize]
    public class FilesControllerV2 : ControllerBase
    {
        private readonly string _vaultRoot;

        public FilesControllerV2(IConfiguration configuration)
        {
            _vaultRoot = configuration["Vault:Root"]
                         ?? configuration["VAULT_ROOT"]
                         ?? "/vault";
        }

        private string SafePath(string relative)
        {
            if (string.IsNullOrEmpty(relative) || relative == "/")
                return Path.GetFullPath(_vaultRoot);

            var candidate = Path.GetFullPath(Path.Combine(_vaultRoot, relative.TrimStart('/', '\\')));

            if (!candidate.StartsWith(Path.GetFullPath(_vaultRoot)))
                throw new UnauthorizedAccessException("Invalid path");

            return candidate;
        }

        /// <summary>
        /// Get file content as raw markdown (no HTML conversion).
        /// Returns { path, markdown }.
        /// </summary>
        [HttpGet("file")]
        public async Task<IActionResult> GetFile([FromQuery] string path)
        {
            var full = SafePath(path);

            if (Directory.Exists(full))
                return BadRequest(new { error = "Path is a directory, use /api/folder or /api/tree instead" });

            if (!System.IO.File.Exists(full))
                return NotFound(new { error = "File not found" });

            var markdown = await System.IO.File.ReadAllTextAsync(full);
            return Ok(new { path, markdown });
        }

        /// <summary>
        /// Preview: returns raw markdown for the given path (no Markdig, no HTML).
        /// Client should render markdown locally.
        /// </summary>
        [HttpGet("preview")]
        public async Task<IActionResult> Preview([FromQuery] string path)
        {
            var full = SafePath(path);

            if (!System.IO.File.Exists(full))
                return NotFound(new { error = "File not found" });

            var markdown = await System.IO.File.ReadAllTextAsync(full);
            return Ok(new { path, markdown });
        }

        /// <summary>
        /// File search by path: returns raw markdown for the file (no Markdig, no HTML).
        /// </summary>
        [HttpGet("files/search")]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            var full = SafePath(q);

            if (!System.IO.File.Exists(full))
                return NotFound(new { error = "File not found" });

            var markdown = await System.IO.File.ReadAllTextAsync(full);
            return Ok(new { path = q, markdown });
        }
    }
}
