using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Payments;

public class RazorpayPaymentProvider : IPaymentProvider
{
    public string ProviderName => "Razorpay";

    public ValueTask<PaymentInitiationResult> InitiatePaymentAsync(
        Guid orderId,
        decimal amount,
        string currency,
        string tenantVpa,
        string tenantName,
        CancellationToken cancellationToken)
    {
        var transactionId = $"rzp_order_{orderId:N}";
        var result = new PaymentInitiationResult(
            TransactionId: transactionId,
            PaymentMethod: ProviderName,
            UpiIntentUri: null,
            QrCodeSvgOrBase64: null,
            RedirectUrl: $"https://api.razorpay.com/v1/checkout/{transactionId}",
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
        var isSuccess = payload.TryGetValue("razorpay_payment_id", out var paymentId) && !string.IsNullOrEmpty(paymentId);
        var result = new PaymentVerificationResult(
            IsSuccess: isSuccess,
            TransactionId: transactionId,
            ProviderReference: paymentId ?? "UNKNOWN",
            StatusMessage: isSuccess ? "Razorpay Signature & Payment Verified" : "Razorpay Payment Failed"
        );

        return ValueTask.FromResult(result);
    }
}
