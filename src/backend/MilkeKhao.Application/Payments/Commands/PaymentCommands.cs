using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Application.Payments.Commands;

public record InitiatePaymentCommand(
    Guid OrderId,
    string PaymentMethod
) : ICommand<PaymentInitiationResult>;

public record VerifyPaymentWebhookCommand(
    string ProviderName,
    string TransactionId,
    IDictionary<string, string> Payload
) : ICommand<PaymentVerificationResult>;

public class InitiatePaymentCommandHandler : ICommandHandler<InitiatePaymentCommand, PaymentInitiationResult>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly ITenantContext _tenantContext;
    private readonly IPaymentProviderFactory _paymentProviderFactory;

    public InitiatePaymentCommandHandler(
        IMilkeKhaoDbContext context,
        ITenantContext tenantContext,
        IPaymentProviderFactory paymentProviderFactory)
    {
        _context = context;
        _tenantContext = tenantContext;
        _paymentProviderFactory = paymentProviderFactory;
    }

    public async ValueTask<PaymentInitiationResult> Handle(InitiatePaymentCommand command, CancellationToken cancellationToken)
    {
        var tenantId = _tenantContext.TenantId;
        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == command.OrderId, cancellationToken);

        if (order == null || order.TenantId != tenantId)
        {
            throw new KeyNotFoundException($"Order {command.OrderId} not found or access denied.");
        }

        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == tenantId, cancellationToken);

        var tenantName = tenant?.Name ?? "MilkeKhao Restaurant";
        var tenantVpa = $"{tenant?.Slug ?? "milkekhao"}@upi";

        var provider = _paymentProviderFactory.GetProvider(command.PaymentMethod);

        return await provider.InitiatePaymentAsync(
            order.Id,
            order.TotalAmount.Amount,
            order.TotalAmount.Currency,
            tenantVpa,
            tenantName,
            cancellationToken
        );
    }
}

public class VerifyPaymentWebhookCommandHandler : ICommandHandler<VerifyPaymentWebhookCommand, PaymentVerificationResult>
{
    private readonly IMilkeKhaoDbContext _context;
    private readonly IPaymentProviderFactory _paymentProviderFactory;

    public VerifyPaymentWebhookCommandHandler(
        IMilkeKhaoDbContext context,
        IPaymentProviderFactory paymentProviderFactory)
    {
        _context = context;
        _paymentProviderFactory = paymentProviderFactory;
    }

    public async ValueTask<PaymentVerificationResult> Handle(VerifyPaymentWebhookCommand command, CancellationToken cancellationToken)
    {
        var provider = _paymentProviderFactory.GetProvider(command.ProviderName);
        var verificationResult = await provider.VerifyPaymentAsync(command.TransactionId, command.Payload, cancellationToken);

        if (verificationResult.IsSuccess)
        {
            // Update order payment status
            if (Guid.TryParse(command.TransactionId.Replace("TXN_UPI_", "").Replace("rzp_order_", "").Replace("payu_tx_", "").Split('_')[0], out var orderId))
            {
                var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);
                if (order != null)
                {
                    order.IsPaid = true;
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }

        return verificationResult;
    }
}
