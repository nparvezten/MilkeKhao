using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Infrastructure.Security;
using Xunit;

namespace MilkeKhao.UnitTests;

public class AuthSecurityTests
{
    [Fact]
    public void JwtTokenService_GeneratesToken_WithTenantIdAndRoleClaims()
    {
        // Arrange
        var secretKey = "MilkeKhao_Super_Secret_Enterprise_JWT_Key_2026_Must_Be_At_Least_256_Bits!";
        var jwtService = new JwtTokenService(secretKey);

        var tenantId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        var user = new User
        {
            Id = userId,
            TenantId = tenantId,
            Email = "kitchen@milkekhao.com",
            PhoneNumber = "+919999900000",
            Name = "Kitchen Admin",
            Role = UserRole.KitchenAdmin
        };

        // Act
        var tokenResult = jwtService.GenerateTokens(user);

        // Assert
        Assert.NotNull(tokenResult);
        Assert.False(string.IsNullOrWhiteSpace(tokenResult.AccessToken));
        Assert.Equal(tenantId, tokenResult.TenantId);
        Assert.Equal("KitchenAdmin", tokenResult.Role);

        // Validate Token
        var (isValid, validatedUserId, validatedTenantId, validatedRole) = jwtService.ValidateAccessToken(tokenResult.AccessToken);

        Assert.True(isValid);
        Assert.Equal(userId, validatedUserId);
        Assert.Equal(tenantId, validatedTenantId);
        Assert.Equal("KitchenAdmin", validatedRole);
    }
}
