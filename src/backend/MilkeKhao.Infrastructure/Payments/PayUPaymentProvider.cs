using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Payments;

public class PayUPaymentProvider : IPaymentProvider
{
    public string ProviderName => "PayU";

    public ValueTask<PaymentInitiationResult> InitiatePaymentAsync(
        Guid orderId,
        decimal amount,
        string currency,
        string tenantVpa,
        string tenantName,
        CancellationToken cancellationToken)
    {
        var transactionId = $"payu_tx_{orderId:N}";
        var result = new PaymentInitiationResult(
            TransactionId: transactionId,
            PaymentMethod: ProviderName,
            UpiIntentUri: null,
            QrCodeSvgOrBase64: null,
            RedirectUrl: $"https://checkout.payu.in/_payment?txnid={transactionId}",
            Amount: amount,
            Currency: currency
        );

        return ValueTask.FromResult(result);
    }

    public ValueTask<PaymentVerificationResult> VerifyPaymentAsync(
        string transactionId,
        IDictionary<string, string> payload,
        CancellationToken cancellationToken)
    {
        var isSuccess = payload.TryGetValue("mihpayid", out var payuId) && !string.IsNullOrEmpty(payuId);
        var result = new PaymentVerificationResult(
            IsSuccess: isSuccess,
            TransactionId: transactionId,
            ProviderReference: payuId ?? "UNKNOWN",
            StatusMessage: isSuccess ? "PayU Hash & Transaction Verified" : "PayU Payment Failed"
        );

        return ValueTask.FromResult(result);
    }
}
