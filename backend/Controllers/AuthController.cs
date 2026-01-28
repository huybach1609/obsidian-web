using backend.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Security.Cryptography;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api")]
    public class AuthController : ControllerBase
    {
        private readonly string _jwtKey;
        private readonly string _configPath;
        private readonly CredentialConfig? _credentialConfig;

        public AuthController(IConfiguration configuration)
        {
            _jwtKey = configuration["JWT_SECRET"]
                      ?? throw new EmptyConfigurationValueException("JWT_SECRET is not configured in environment variables.");

            // Path to the Obsidian vault config file that stores credentials.
            // Vault root comes from appsettings.json: "vault": { "root": "/vault" }.
            // We then look for /vault/.obsidian-web/config.json (or equivalent root).
            var vaultRoot = configuration["vault:root"]
                            ?? "/vault";

            _configPath = Path.Combine(
                vaultRoot,
                ".obsidian-web",
                "config.json");

            if (System.IO.File.Exists(_configPath))
            {
                var json = System.IO.File.ReadAllText(_configPath);
                _credentialConfig = JsonSerializer.Deserialize<CredentialConfig>(json);
            }
            else
            {
                _credentialConfig = null;
            }
        }

        // POST /api/login
        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            // If credentials are not yet configured, tell the frontend so it can redirect
            // the user to a "create account" flow.
            if (_credentialConfig == null || string.IsNullOrEmpty(_credentialConfig.Username) || string.IsNullOrEmpty(_credentialConfig.PasswordHash) || string.IsNullOrEmpty(_credentialConfig.Salt))
            {
                // 404 with a specific error code keeps behavior simple for the frontend.
                return NotFound(new { error = "CredentialsNotConfigured" });
            }

            if (req.Username == _credentialConfig.Username &&
                VerifyPassword(req.Password, _credentialConfig.Salt, _credentialConfig.PasswordHash))
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.UTF8.GetBytes(_jwtKey);
                var tokenDescriptor = new SecurityTokenDescriptor
                {
                    Expires = DateTime.UtcNow.AddDays(7),
                    SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
                };

                var token = tokenHandler.CreateToken(tokenDescriptor);

                return Ok(new { token = tokenHandler.WriteToken(token) });
            }

            return Unauthorized();
        }

        // GET /api/account
        // Returns basic account information (currently only username).
        [HttpGet("account")]
        [Authorize]
        public IActionResult GetAccount()
        {
            if (_credentialConfig == null)
            {
                return NotFound(new { error = "CredentialsNotConfigured" });
            }

            return Ok(new { username = _credentialConfig.Username });
        }

        // POST /api/account
        // Allows changing username and/or password for the existing account.
        [HttpPost("account")]
        [Authorize]
        public IActionResult UpdateAccount([FromBody] UpdateAccountRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.CurrentPassword))
            {
                return BadRequest(new { error = "CurrentPasswordRequired" });
            }

            if (_credentialConfig == null)
            {
                return NotFound(new { error = "CredentialsNotConfigured" });
            }

            if (!VerifyPassword(req.CurrentPassword, _credentialConfig.Salt, _credentialConfig.PasswordHash))
            {
                return Unauthorized(new { error = "InvalidCurrentPassword" });
            }

            var newUsername = string.IsNullOrWhiteSpace(req.NewUsername)
                ? _credentialConfig.Username
                : req.NewUsername;

            var newSalt = _credentialConfig.Salt;
            var newPasswordHash = _credentialConfig.PasswordHash;

            if (!string.IsNullOrWhiteSpace(req.NewPassword))
            {
                var saltBytes = RandomNumberGenerator.GetBytes(16);
                newSalt = Convert.ToBase64String(saltBytes);
                newPasswordHash = HashPassword(req.NewPassword, newSalt);
            }

            var updatedConfig = new CredentialConfig
            {
                Username = newUsername,
                PasswordHash = newPasswordHash,
                Salt = newSalt
            };

            var json = JsonSerializer.Serialize(updatedConfig, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            var directory = Path.GetDirectoryName(_configPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            System.IO.File.WriteAllText(_configPath, json);

            return Ok(new { username = newUsername });
        }

        // POST /api/register
        // Called by the frontend "create account" screen to create the initial credentials
        // and save them (encrypted/hash) into the Obsidian config file.
        [HttpPost("register")]
        [AllowAnonymous]
        public IActionResult Register([FromBody] RegisterRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            {
                return BadRequest(new { error = "UsernameAndPasswordRequired" });
            }

            // If credentials already exist, do not overwrite them.
            if (System.IO.File.Exists(_configPath))
            {
                return Conflict(new { error = "CredentialsAlreadyConfigured" });
            }

            var saltBytes = RandomNumberGenerator.GetBytes(16);
            var salt = Convert.ToBase64String(saltBytes);
            var passwordHash = HashPassword(req.Password, salt);

            var config = new CredentialConfig
            {
                Username = req.Username,
                PasswordHash = passwordHash,
                Salt = salt
            };

            var json = JsonSerializer.Serialize(config, new JsonSerializerOptions
            {
                WriteIndented = true
            });

            var directory = Path.GetDirectoryName(_configPath);
            if (!string.IsNullOrEmpty(directory))
            {
                Directory.CreateDirectory(directory);
            }

            System.IO.File.WriteAllText(_configPath, json);

            return Ok();
        }

        private static string HashPassword(string password, string salt)
        {
            var saltBytes = Convert.FromBase64String(salt);
            using var deriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 100_000, HashAlgorithmName.SHA256);
            var hash = deriveBytes.GetBytes(32);
            return Convert.ToBase64String(hash);
        }

        private static bool VerifyPassword(string password, string salt, string expectedHash)
        {
            var actualHash = HashPassword(password, salt);
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromBase64String(expectedHash),
                Convert.FromBase64String(actualHash));
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class RegisterRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class UpdateAccountRequest
        {
            public string CurrentPassword { get; set; } = string.Empty;
            public string? NewUsername { get; set; }
            public string? NewPassword { get; set; }
        }

        private class CredentialConfig
        {
            public string Username { get; set; } = string.Empty;
            public string PasswordHash { get; set; } = string.Empty;
            public string Salt { get; set; } = string.Empty;
        }
    }
}


