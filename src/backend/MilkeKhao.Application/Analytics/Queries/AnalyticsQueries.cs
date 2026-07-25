using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Analytics.Queries;

public record SalesSummaryDto(
    decimal TotalSales,
    int TotalOrders,
    decimal AverageOrderValue,
    int CompletedOrders,
    int CancelledOrders
);

public record TopSellingItemDto(
    Guid MenuItemId,
    string Name,
    int TotalQuantitySold,
    decimal TotalRevenue
);

public record DeliveryModeBreakdownDto(
    string DeliveryMode,
    int Count,
    decimal Percentage
);

public record GetSalesSummaryQuery(
    DateTimeOffset? StartDate = null,
    DateTimeOffset? EndDate = null
) : IQuery<SalesSummaryDto>;

public record GetTopSellingItemsQuery(int TopCount = 5) : IQuery<List<TopSellingItemDto>>;

public record GetOrdersByDeliveryModeQuery() : IQuery<List<DeliveryModeBreakdownDto>>;

public class AnalyticsQueryHandlers :
    IQueryHandler<GetSalesSummaryQuery, SalesSummaryDto>,
    IQueryHandler<GetTopSellingItemsQuery, List<TopSellingItemDto>>,
    IQueryHandler<GetOrdersByDeliveryModeQuery, List<DeliveryModeBreakdownDto>>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;

    public AnalyticsQueryHandlers(IMilkeKhaoDbContext context, ITenantContext tenantContext)
    {
        _context = context;
        _tenantContext = tenantContext;
    }

    public async ValueTask<SalesSummaryDto> Handle(GetSalesSummaryQuery query, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;
        var orders = await _context.Orders
            .Where(o => o.TenantId == tenantId)
            .ToListAsync(cancellationToken);

        var totalOrders = orders.Count;
        var completedOrders = orders.Count(o => o.Status == OrderStatus.Delivered);
        var cancelledOrders = orders.Count(o => o.Status == OrderStatus.Cancelled);
        var totalSales = orders.Where(o => o.Status == OrderStatus.Delivered).Sum(o => o.TotalAmount.Amount);
        var avgValue = completedOrders > 0 ? totalSales / completedOrders : 0;

        return new SalesSummaryDto(
            TotalSales: totalSales,
            TotalOrders: totalOrders,
            AverageOrderValue: avgValue,
            CompletedOrders: completedOrders,
            CancelledOrders: cancelledOrders
        );
    }

    public async ValueTask<List<TopSellingItemDto>> Handle(GetTopSellingItemsQuery query, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;

        // Group items sold across completed orders
        var items = await _context.Orders
            .Where(o => o.TenantId == tenantId)
            .SelectMany(o => o.Items)
            .GroupBy(i => i.MenuItemId)
            .Select(g => new
            {
                MenuItemId = g.Key,
                TotalQty = g.Sum(x => x.Quantity),
                TotalRev = g.Sum(x => x.UnitPrice * x.Quantity)
            })
            .OrderByDescending(x => x.TotalQty)
            .Take(query.TopCount)
            .ToListAsync(cancellationToken);

        var result = new List<TopSellingItemDto>();
        foreach (var item in items)
        {
            var menuItem = await _context.MenuItems.FirstOrDefaultAsync(m => m.Id == item.MenuItemId, cancellationToken);
            result.Add(new TopSellingItemDto(
                MenuItemId: item.MenuItemId,
                Name: menuItem?.Name ?? "Special Item",
                TotalQuantitySold: item.TotalQty,
                TotalRevenue: item.TotalRev
            ));
        }

        return result;
    }

    public async ValueTask<List<DeliveryModeBreakdownDto>> Handle(GetOrdersByDeliveryModeQuery query, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;
        var orders = await _context.Orders.Where(o => o.TenantId == tenantId).ToListAsync(cancellationToken);

        var total = orders.Count;
        if (total == 0)
        {
            return new List<DeliveryModeBreakdownDto>
            {
                new DeliveryModeBreakdownDto("Pickup", 0, 0),
                new DeliveryModeBreakdownDto("InHouseDelivery", 0, 0)
            };
        }

        return orders
            .GroupBy(o => o.DeliveryMode.ToString())
            .Select(g => new DeliveryModeBreakdownDto(
                DeliveryMode: g.Key,
                Count: g.Count(),
                Percentage: (g.Count() / (decimal)total) * 100
            ))
            .ToList();
    }
}
