using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Api.Middleware;

public class TenantContextMiddleware
{
    private readonly RequestDelegate _next;

    public TenantContextMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ITenantContext tenantContext, IJwtTokenService jwtTokenService)
    {
        // 1. Try resolving TenantId from Authorization Bearer JWT claim
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();
        if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            var token = authHeader.Substring("Bearer ".Length).Trim();
            var (isValid, _, tenantId, _) = jwtTokenService.ValidateAccessToken(token);
            if (isValid && tenantId != Guid.Empty)
            {
                tenantContext.SetTenantId(tenantId);
                await _next(context);
                return;
            }
        }

        // 2. Fallback to X-Tenant-Id header for public storefront browsing / development
        var tenantHeader = context.Request.Headers["X-Tenant-Id"].FirstOrDefault();
        if (Guid.TryParse(tenantHeader, out var headerTenantId))
        {
            tenantContext.SetTenantId(headerTenantId);
        }
        else
        {
            // Launch default tenant context ("Swaad Foods")
            tenantContext.SetTenantId(Guid.Parse("99999999-9999-9999-9999-999999999999"));
        }

        await _next(context);
    }
}
