using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Application.Tenants;

public record RegisterTenantCommand(
    string Name,
    string Slug,
    string Vpa,
    List<string> EnabledDeliveryModes,
    List<string> EnabledPaymentMethods,
    bool GstRegistered,
    string? GstNumber = null
) : IRequest<TenantRegistrationResult>;

public record TenantRegistrationResult(
    Guid TenantId,
    string Name,
    string Slug,
    string Message
);

public class RegisterTenantCommandHandler : IRequestHandler<RegisterTenantCommand, TenantRegistrationResult>
{
    private readonly IMilkeKhaoDbContext _dbContext;

    public RegisterTenantCommandHandler(IMilkeKhaoDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async ValueTask<TenantRegistrationResult> Handle(RegisterTenantCommand request, CancellationToken cancellationToken)
    {
        var cleanSlug = request.Slug.Trim().ToLowerInvariant().Replace(" ", "-");

        var existing = await _dbContext.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == cleanSlug, cancellationToken);

        if (existing != null)
        {
            throw new InvalidOperationException($"A restaurant with slug '{cleanSlug}' is already registered.");
        }

        var tenantId = Guid.NewGuid();
        var newTenant = new Tenant
        {
            Id = tenantId,
            Name = request.Name.Trim(),
            Slug = cleanSlug,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            Settings = new TenantFeatureSettings
            {
                EnabledDeliveryModes = request.EnabledDeliveryModes.Any()
                    ? request.EnabledDeliveryModes
                    : new List<string> { "Pickup", "InHouseDelivery" },
                EnabledPaymentMethods = request.EnabledPaymentMethods.Any()
                    ? request.EnabledPaymentMethods
                    : new List<string> { "UpiIntent", "UpiQr" },
                MaxStaffAccounts = 1,
                GstRegistered = request.GstRegistered
            }
        };

        _dbContext.Tenants.Add(newTenant);

        // Seed initial starter menu for the newly onboarded restaurant
        var starterCategory = new Category
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = "Chef Specials",
            DisplayOrder = 1
        };
        _dbContext.Categories.Add(starterCategory);

        _dbContext.MenuItems.AddRange(
            new MenuItem
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CategoryId = starterCategory.Id,
                Name = "Signature Paneer Tikka",
                Description = "Fresh cottage cheese marinated in spiced yogurt and grilled in clay tandoor",
                Price = new Money(280.00m, "INR"),
                IsAvailable = true
            },
            new MenuItem
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                CategoryId = starterCategory.Id,
                Name = "Butter Garlic Naan",
                Description = "Tandoor-baked flatbread glazed with melted salted butter and roasted garlic",
                Price = new Money(60.00m, "INR"),
                IsAvailable = true
            }
        );

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new TenantRegistrationResult(
            TenantId: tenantId,
            Name: newTenant.Name,
            Slug: newTenant.Slug,
            Message: "Restaurant successfully onboarded and live menu initialized!"
        );
    }
}
