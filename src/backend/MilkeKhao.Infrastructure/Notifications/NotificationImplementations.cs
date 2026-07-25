using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Infrastructure.Notifications;

public class SignalRNotificationDispatcher : INotificationDispatcher
{
    private readonly IHubContext<Hub> _hubContext;
    private readonly ILogger<SignalRNotificationDispatcher> _logger;

    public SignalRNotificationDispatcher(
        IHubContext<Hub> hubContext,
        ILogger<SignalRNotificationDispatcher> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async ValueTask SendOrderStatusUpdatedNotificationAsync(Guid tenantId, Guid orderId, OrderStatus newStatus, CancellationToken cancellationToken = default)
    {
        var groupName = $"tenant_{tenantId}";
        var timestamp = DateTimeOffset.UtcNow.ToString("o");

        _logger.LogInformation("Broadcasting OrderStatusUpdated for Order {OrderId} (Status: {Status}) to SignalR Group {GroupName}", orderId, newStatus, groupName);

        await _hubContext.Clients.Group(groupName).SendAsync("OrderStatusUpdated", orderId, newStatus, timestamp, cancellationToken);
    }

    public async ValueTask SendPaymentCapturedNotificationAsync(Guid tenantId, Guid orderId, decimal amount, CancellationToken cancellationToken = default)
    {
        var groupName = $"tenant_{tenantId}";
        var timestamp = DateTimeOffset.UtcNow.ToString("o");

        _logger.LogInformation("Broadcasting PaymentCaptured for Order {OrderId} (Amount: {Amount}) to SignalR Group {GroupName}", orderId, amount, groupName);

        await _hubContext.Clients.Group(groupName).SendAsync("PaymentCaptured", orderId, amount, timestamp, cancellationToken);
    }
}

public class MockEmailNotificationSender : IEmailNotificationSender
{
    private readonly ILogger<MockEmailNotificationSender> _logger;

    public MockEmailNotificationSender(ILogger<MockEmailNotificationSender> logger)
    {
        _logger = logger;
    }

    public ValueTask SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[Email Dispatched] To: {Recipient} | Subject: {Subject}", recipientEmail, subject);
        return ValueTask.CompletedTask;
    }
}

public class MockSmsNotificationSender : ISmsNotificationSender
{
    private readonly ILogger<MockSmsNotificationSender> _logger;

    public MockSmsNotificationSender(ILogger<MockSmsNotificationSender> logger)
    {
        _logger = logger;
    }

    public ValueTask SendSmsAsync(string recipientPhoneNumber, string message, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[SMS Dispatched] To: {Recipient} | Message: {Message}", recipientPhoneNumber, message);
        return ValueTask.CompletedTask;
    }
}
