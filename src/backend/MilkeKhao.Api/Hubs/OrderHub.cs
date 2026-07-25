using Microsoft.AspNetCore.SignalR;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Api.Hubs;

public interface IOrderHubClient
{
    Task OrderStatusUpdated(Guid orderId, OrderStatus status, string timestamp);
    Task PaymentCaptured(Guid orderId, decimal amount, string timestamp);
}

public class OrderHub : Hub<IOrderHubClient>
{
    public async Task JoinTenantGroup(string tenantId)
    {
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
        }
    }

    public async Task LeaveTenantGroup(string tenantId)
    {
        if (!string.IsNullOrEmpty(tenantId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"tenant_{tenantId}");
        }
    }
}
