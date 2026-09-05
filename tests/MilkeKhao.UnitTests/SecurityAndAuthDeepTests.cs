using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Infrastructure.Security;
using Xunit;

namespace MilkeKhao.UnitTests;

public class SecurityAndAuthDeepTests
{
    private readonly JwtTokenService _jwtService = new JwtTokenService(
        "MilkeKhao_Super_Secret_Enterprise_JWT_Key_2026_Must_Be_At_Least_256_Bits!",
        "MilkeKhaoAPI",
        "MilkeKhaoClients",
        15
    );

    [Fact]
    public void GenerateTokens_Creates_Valid_JWT_With_All_Required_Claims()
    {
        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            TenantId = tenantId,
            Email = "kitchen.admin@swaadfoods.com",
            Name = "Swaad Kitchen Admin",
            Role = UserRole.KitchenAdmin
        };

        // Act
        var tokens = _jwtService.GenerateTokens(user);

        // Assert
        Assert.NotNull(tokens);
        Assert.False(string.IsNullOrEmpty(tokens.AccessToken));
        Assert.False(string.IsNullOrEmpty(tokens.RefreshToken));

        // Validate
        var (isValid, validatedUserId, validatedTenantId, role) = _jwtService.ValidateAccessToken(tokens.AccessToken);
        Assert.True(isValid);
        Assert.Equal(tenantId, validatedTenantId);
        Assert.Equal(userId, validatedUserId);
        Assert.Equal(UserRole.KitchenAdmin.ToString(), role);
    }

    [Fact]
    public void ValidateAccessToken_Rejects_Invalid_Or_Tampered_Tokens()
    {
        var tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";

        var (isValid, _, _, _) = _jwtService.ValidateAccessToken(tamperedToken);
        Assert.False(isValid);
    }
}
