using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Menu.Commands;
using MilkeKhao.Application.Menu.DTOs;
using MilkeKhao.Application.Menu.Queries;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.ValueObjects;

namespace MilkeKhao.Application.Menu.Handlers;

public class MenuQueryHandler : IQueryHandler<GetActiveMenuQuery, List<MenuItemDto>>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public MenuQueryHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<List<MenuItemDto>> Handle(GetActiveMenuQuery query, CancellationToken cancellationToken)
    {
        var items = await _context.MenuItems
            .Where(m => m.IsAvailable)
            .Select(m => new MenuItemDto(
                m.Id,
                m.TenantId,
                m.CategoryId,
                m.Name,
                m.Description,
                m.Price.Amount,
                m.Price.Currency,
                m.ImageUrl,
                m.IsAvailable
            ))
            .ToListAsync(cancellationToken);

        return items;
    }
}

public class CreateMenuItemCommandHandler : ICommandHandler<CreateMenuItemCommand, MenuItemDto>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public CreateMenuItemCommandHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<MenuItemDto> Handle(CreateMenuItemCommand command, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;

        var menuItem = new MenuItem
        {
            TenantId = tenantId,
            CategoryId = command.CategoryId,
            Name = command.Name,
            Description = command.Description,
            Price = new Money(command.Price, "INR"),
            ImageUrl = command.ImageUrl,
            IsAvailable = true
        };

        _context.MenuItems.Add(menuItem);
        await _context.SaveChangesAsync(cancellationToken);

        return new MenuItemDto(
            menuItem.Id,
            menuItem.TenantId,
            menuItem.CategoryId,
            menuItem.Name,
            menuItem.Description,
            menuItem.Price.Amount,
            menuItem.Price.Currency,
            menuItem.ImageUrl,
            menuItem.IsAvailable
        );
    }
}

public class ToggleMenuItemAvailabilityCommandHandler : ICommandHandler<ToggleMenuItemAvailabilityCommand, bool>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public ToggleMenuItemAvailabilityCommandHandler(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<bool> Handle(ToggleMenuItemAvailabilityCommand command, CancellationToken cancellationToken)
    {
        var menuItem = await _context.MenuItems
            .FirstOrDefaultAsync(m => m.Id == command.MenuItemId, cancellationToken);

        if (menuItem == null)
            return false;

        menuItem.IsAvailable = !menuItem.IsAvailable;
        await _context.SaveChangesAsync(cancellationToken);

        return menuItem.IsAvailable;
    }
}
