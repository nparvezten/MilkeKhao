using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Common.Interfaces;

public interface INotificationDispatcher
{
    ValueTask SendOrderStatusUpdatedNotificationAsync(Guid tenantId, Guid orderId, OrderStatus newStatus, CancellationToken cancellationToken = default);
    ValueTask SendPaymentCapturedNotificationAsync(Guid tenantId, Guid orderId, decimal amount, CancellationToken cancellationToken = default);
}

public interface IEmailNotificationSender
{
    ValueTask SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default);
}

public interface ISmsNotificationSender
{
    ValueTask SendSmsAsync(string recipientPhoneNumber, string message, CancellationToken cancellationToken = default);
}

public interface IWhatsAppNotificationSender
{
    ValueTask SendWhatsAppMessageAsync(string recipientPhoneNumber, string message, CancellationToken cancellationToken = default);
}

