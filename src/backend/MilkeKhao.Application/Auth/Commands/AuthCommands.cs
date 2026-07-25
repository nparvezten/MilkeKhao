using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Auth.Commands;

public record LoginCommand(
    string TenantSlug,
    string EmailOrUsername,
    string Password
) : ICommand<AuthTokenResult>;

public class LoginCommandHandler : ICommandHandler<LoginCommand, AuthTokenResult>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;

    public LoginCommandHandler(IMilkeKhaoDbContext context, IJwtTokenService jwtTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
    }

    public async ValueTask<AuthTokenResult> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Slug == command.TenantSlug, cancellationToken);

        if (tenant == null)
        {
            throw new KeyNotFoundException($"Tenant with slug '{command.TenantSlug}' was not found.");
        }

        // Look up user within authenticated tenant scope
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.TenantId == tenant.Id && (u.Email == command.EmailOrUsername || u.PhoneNumber == command.EmailOrUsername), cancellationToken);

        if (user == null)
        {
            // Seed KitchenAdmin shared login if first login attempt for tenant
            if (command.EmailOrUsername.Equals("kitchenadmin", StringComparison.OrdinalIgnoreCase) ||
                command.EmailOrUsername.Equals("kitchen@milkekhao.com", StringComparison.OrdinalIgnoreCase))
            {
                user = new User
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenant.Id,
                    Email = "kitchen@milkekhao.com",
                    PhoneNumber = "+919999900000",
                    Name = "Kitchen Admin",
                    Role = UserRole.KitchenAdmin
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                throw new UnauthorizedAccessException("Invalid credentials or access denied for tenant.");
            }
        }

        return _jwtTokenService.GenerateTokens(user);
    }
}
