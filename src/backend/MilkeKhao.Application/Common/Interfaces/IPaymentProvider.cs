namespace MilkeKhao.Application.Common.Interfaces;

public record PaymentInitiationResult(
    string TransactionId,
    string PaymentMethod,
    string? UpiIntentUri,
    string? QrCodeSvgOrBase64,
    string? RedirectUrl,
    decimal Amount,
    string Currency
);

public record PaymentVerificationResult(
    bool IsSuccess,
    string TransactionId,
    string ProviderReference,
    string StatusMessage
);

public interface IPaymentProvider
{
    string ProviderName { get; }
    ValueTask<PaymentInitiationResult> InitiatePaymentAsync(Guid orderId, decimal amount, string currency, string tenantVpa, string tenantName, CancellationToken cancellationToken);
    ValueTask<PaymentVerificationResult> VerifyPaymentAsync(string transactionId, IDictionary<string, string> payload, CancellationToken cancellationToken);
}
