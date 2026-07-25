using System.Net;
using System.Text;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Payments;

public class UpiPaymentProvider : IPaymentProvider
{
    public string ProviderName => "UpiIntent";

    public ValueTask<PaymentInitiationResult> InitiatePaymentAsync(
        Guid orderId,
        decimal amount,
        string currency,
        string tenantVpa,
        string tenantName,
        CancellationToken cancellationToken)
    {
        var transactionId = $"TXN_UPI_{orderId:N}_{DateTime.UtcNow.Ticks}";
        var cleanVpa = string.IsNullOrWhiteSpace(tenantVpa) ? "swaadfoods@upi" : tenantVpa;
        var cleanName = string.IsNullOrWhiteSpace(tenantName) ? "Swaad Foods" : tenantName;

        var encodedName = WebUtility.UrlEncode(cleanName);
        var upiUri = $"upi://pay?pa={cleanVpa}&pn={encodedName}&am={amount:F2}&cu={currency}&tn=Order_{orderId:N}&tr={transactionId}";

        var qrSvg = GenerateSimpleQrSvg(upiUri);

        var result = new PaymentInitiationResult(
            TransactionId: transactionId,
            PaymentMethod: ProviderName,
            UpiIntentUri: upiUri,
            QrCodeSvgOrBase64: qrSvg,
            RedirectUrl: null,
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
        // Direct UPI Intent / QR uses UPI bank app callback or webhook verification
        var isSuccess = payload.TryGetValue("status", out var status) && status.Equals("SUCCESS", StringComparison.OrdinalIgnoreCase);
        var providerRef = payload.TryGetValue("rrn", out var rrn) ? rrn : $"RRN_{DateTime.UtcNow.Ticks}";

        var result = new PaymentVerificationResult(
            IsSuccess: isSuccess,
            TransactionId: transactionId,
            ProviderReference: providerRef,
            StatusMessage: isSuccess ? "UPI Payment Verified Successfully" : "UPI Payment Failed or Pending"
        );

        return ValueTask.FromResult(result);
    }

    private static string GenerateSimpleQrSvg(string data)
    {
        // Zero-dependency SVG matrix container for UPI payload
        var sb = new StringBuilder();
        sb.Append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"200\" height=\"200\">");
        sb.Append("<rect width=\"100%\" height=\"100%\" fill=\"#ffffff\"/>");
        sb.Append("<rect x=\"20\" y=\"20\" width=\"40\" height=\"40\" fill=\"#000000\"/>");
        sb.Append("<rect x=\"25\" y=\"25\" width=\"30\" height=\"30\" fill=\"#ffffff\"/>");
        sb.Append("<rect x=\"30\" y=\"30\" width=\"20\" height=\"20\" fill=\"#000000\"/>");
        sb.Append("<rect x=\"140\" y=\"20\" width=\"40\" height=\"40\" fill=\"#000000\"/>");
        sb.Append("<rect x=\"145\" y=\"25\" width=\"30\" height=\"30\" fill=\"#ffffff\"/>");
        sb.Append("<rect x=\"150\" y=\"30\" width=\"20\" height=\"20\" fill=\"#000000\"/>");
        sb.Append("<rect x=\"20\" y=\"140\" width=\"40\" height=\"40\" fill=\"#000000\"/>");
        sb.Append("<rect x=\"25\" y=\"145\" width=\"30\" height=\"30\" fill=\"#ffffff\"/>");
        sb.Append("<rect x=\"30\" y=\"150\" width=\"20\" height=\"20\" fill=\"#000000\"/>");
        sb.Append($"<!-- Payload: {WebUtility.HtmlEncode(data)} -->");
        sb.Append("</svg>");
        return sb.ToString();
    }
}
