using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/vimconfig")]
    [Authorize]
    public class VimConfigController : ControllerBase
    {
        private readonly string _vaultRoot;
        private const string ConfigPath = ".obsidian-web/config-vim.json";

        public VimConfigController(IConfiguration configuration)
        {
            _vaultRoot = configuration["Vault:Root"]
                         ?? configuration["VAULT_ROOT"]
                         ?? "/vault";
        }

        private string GetConfigFilePath()
        {
            var configDir = Path.Combine(_vaultRoot, ".obsidian-web");
            var configFile = Path.Combine(configDir, "config-vim.json");
            return configFile;
        }

        // GET /api/vimconfig
        [HttpGet]
        public async Task<IActionResult> GetVimConfig()
        {
            var configFile = GetConfigFilePath();

            // If file doesn't exist, create default config
            if (!System.IO.File.Exists(configFile))
            {
                var configDir = Path.GetDirectoryName(configFile);
                if (!string.IsNullOrEmpty(configDir) && !Directory.Exists(configDir))
                {
                    Directory.CreateDirectory(configDir);
                }

                var defaultConfig = new
                {
                    keyMappings = Array.Empty<object>(),
                    exCommands = Array.Empty<object>(),
                    unmappedKeys = Array.Empty<object>(),
                    createdAt = DateTime.UtcNow.ToString("O"),
                    updatedAt = DateTime.UtcNow.ToString("O")
                };

                var json = JsonSerializer.Serialize(defaultConfig, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await System.IO.File.WriteAllTextAsync(configFile, json, Encoding.UTF8);
                return Ok(defaultConfig);
            }

            try
            {
                var content = await System.IO.File.ReadAllTextAsync(configFile, Encoding.UTF8);
                var config = JsonSerializer.Deserialize<object>(content);
                return Ok(config);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to read config: {ex.Message}" });
            }
        }

        // POST /api/vimconfig
        [HttpPost]
        public async Task<IActionResult> SaveVimConfig([FromBody] object configData)
        {
            var configFile = GetConfigFilePath();
            var configDir = Path.GetDirectoryName(configFile);

            // Ensure directory exists
            if (!string.IsNullOrEmpty(configDir) && !Directory.Exists(configDir))
            {
                Directory.CreateDirectory(configDir);
            }

            try
            {
                // Parse the incoming config to add/update timestamps
                var jsonDoc = JsonDocument.Parse(JsonSerializer.Serialize(configData));
                var root = jsonDoc.RootElement;

                // Create updated config with timestamps
                var updatedAt = DateTime.UtcNow.ToString("O");
                string createdAt;

                // Check if file exists to preserve createdAt
                if (System.IO.File.Exists(configFile))
                {
                    try
                    {
                        var existingContent = await System.IO.File.ReadAllTextAsync(configFile, Encoding.UTF8);
                        var existingDoc = JsonDocument.Parse(existingContent);
                        if (existingDoc.RootElement.TryGetProperty("createdAt", out var existingCreatedAt))
                        {
                            createdAt = existingCreatedAt.GetString() ?? DateTime.UtcNow.ToString("O");
                        }
                        else
                        {
                            createdAt = DateTime.UtcNow.ToString("O");
                        }
                    }
                    catch
                    {
                        createdAt = DateTime.UtcNow.ToString("O");
                    }
                }
                else
                {
                    createdAt = DateTime.UtcNow.ToString("O");
                }

                // Build new config object with timestamps
                var configWithTimestamps = new Dictionary<string, object>();
                
                if (root.TryGetProperty("keyMappings", out var keyMappings))
                    configWithTimestamps["keyMappings"] = JsonSerializer.Deserialize<object>(keyMappings.GetRawText());
                else
                    configWithTimestamps["keyMappings"] = Array.Empty<object>();

                if (root.TryGetProperty("exCommands", out var exCommands))
                    configWithTimestamps["exCommands"] = JsonSerializer.Deserialize<object>(exCommands.GetRawText());
                else
                    configWithTimestamps["exCommands"] = Array.Empty<object>();

                if (root.TryGetProperty("unmappedKeys", out var unmappedKeys))
                    configWithTimestamps["unmappedKeys"] = JsonSerializer.Deserialize<object>(unmappedKeys.GetRawText());
                else
                    configWithTimestamps["unmappedKeys"] = Array.Empty<object>();

                configWithTimestamps["createdAt"] = createdAt;
                configWithTimestamps["updatedAt"] = updatedAt;

                // Atomic write using temp file then move
                var tmp = configFile + ".tmp";
                var json = JsonSerializer.Serialize(configWithTimestamps, new JsonSerializerOptions
                {
                    WriteIndented = true
                });

                await System.IO.File.WriteAllTextAsync(tmp, json, Encoding.UTF8);
                System.IO.File.Move(tmp, configFile, true);

                return Ok(configWithTimestamps);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = $"Failed to save config: {ex.Message}" });
            }
        }
    }
}
