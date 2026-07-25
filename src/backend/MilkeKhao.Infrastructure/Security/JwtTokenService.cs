using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Infrastructure.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly int _expiryMinutes;

    static JwtTokenService()
    {
        JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
    }

    public JwtTokenService(string secretKey, string issuer = "MilkeKhaoAPI", string audience = "MilkeKhaoClients", int expiryMinutes = 15)
    {
        _secretKey = string.IsNullOrWhiteSpace(secretKey)
            ? "MilkeKhao_Super_Secret_Enterprise_JWT_Key_2026_Must_Be_At_Least_256_Bits!"
            : secretKey;
        _issuer = issuer;
        _audience = audience;
        _expiryMinutes = expiryMinutes;
    }

    public AuthTokenResult GenerateTokens(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_secretKey);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("tenant_id", user.TenantId.ToString()),
            new Claim("user_id", user.Id.ToString()),
            new Claim("role", user.Role.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_expiryMinutes),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var accessToken = tokenHandler.WriteToken(token);
        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        return new AuthTokenResult(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresInSeconds: _expiryMinutes * 60,
            Role: user.Role.ToString(),
            TenantId: user.TenantId,
            UserId: user.Id,
            Email: user.Email
        );
    }

    public (bool IsValid, Guid UserId, Guid TenantId, string Role) ValidateAccessToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_secretKey);

        try
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = false
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);

            var tenantClaim = principal.FindFirst("tenant_id")?.Value;
            var userClaim = principal.FindFirst("user_id")?.Value;
            var roleClaim = principal.FindFirst("role")?.Value ?? principal.FindFirst(ClaimTypes.Role)?.Value;

            if (Guid.TryParse(tenantClaim, out var tenantId) &&
                Guid.TryParse(userClaim, out var userId) &&
                !string.IsNullOrEmpty(roleClaim))
            {
                return (true, userId, tenantId, roleClaim);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[JwtTokenService Validation Error] {ex.Message}");
        }

        return (false, Guid.Empty, Guid.Empty, string.Empty);
    }
}
