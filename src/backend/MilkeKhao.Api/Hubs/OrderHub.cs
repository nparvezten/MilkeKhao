using Microsoft.AspNetCore.SignalR;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Api.Hubs;

public interface IOrderHubClient
{
    Task OrderStatusUpdated(Guid orderId, OrderStatus status, string timestamp);
    Task PaymentCaptured(Guid orderId, decimal amount, string timestamp);
    Task DriverLocationUpdated(string orderId, double latitude, double longitude, double speed, string timestamp);
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

    /// <summary>
    /// Broadcasts real-time GPS coordinates of the assigned delivery rider to the tenant group.
    /// </summary>
    public async Task BroadcastDriverLocation(string tenantId, string orderId, double latitude, double longitude, double speed)
    {
        if (!string.IsNullOrEmpty(tenantId) && !string.IsNullOrEmpty(orderId))
        {
            var timestamp = DateTimeOffset.UtcNow.ToString("o");
            await Clients.Group($"tenant_{tenantId}").DriverLocationUpdated(orderId, latitude, longitude, speed, timestamp);
        }
    }
}
