using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Application.Common.Interfaces;

public record AuthTokenResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresInSeconds,
    string Role,
    Guid TenantId,
    Guid UserId,
    string Email
);

public interface IJwtTokenService
{
    AuthTokenResult GenerateTokens(User user);
    (bool IsValid, Guid UserId, Guid TenantId, string Role) ValidateAccessToken(string token);
}
