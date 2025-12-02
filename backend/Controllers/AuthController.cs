using backend.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;

namespace backend.Controllers
{
    [ApiController]
    [Route("api")]
    public class AuthController : ControllerBase
    {
        private readonly string _jwtKey;
        private readonly string _username;
        private readonly string _password;

        public AuthController(IConfiguration configuration)
        {
            _jwtKey = configuration["JWT_SECRET"]
                      ?? throw new EmptyConfigurationValueException("JWT_SECRET is not configured in environment variables.");

            _username = configuration["credential:username"]
                        ?? throw new EmptyConfigurationValueException("credential__username is not configured in environment variables.");

            _password = configuration["credential:password"]
                        ?? throw new EmptyConfigurationValueException("credential__password is not configured in environment variables.");
        }

        // POST /api/login
        [HttpPost("login")]
        [AllowAnonymous]
        public IActionResult Login([FromBody] LoginRequest req)
        {
            if (req.Username == _username && req.Password == _password)
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
    }
}


