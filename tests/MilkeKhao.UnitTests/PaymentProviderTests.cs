using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Infrastructure.Payments;
using Xunit;

namespace MilkeKhao.UnitTests;

public class PaymentProviderTests
{
    [Fact]
    public async Task UpiPaymentProvider_GeneratesValidUpiIntentUri_AndQrSvgPayload()
    {
        // Arrange
        var provider = new UpiPaymentProvider();
        var orderId = Guid.NewGuid();
        var amount = 450.50m;
        var currency = "INR";
        var tenantVpa = "swaad@upi";
        var tenantName = "Swaad Foods";

        // Act
        var result = await provider.InitiatePaymentAsync(orderId, amount, currency, tenantVpa, tenantName, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("UpiIntent", result.PaymentMethod);
        Assert.NotNull(result.UpiIntentUri);
        Assert.Contains("upi://pay?", result.UpiIntentUri);
        Assert.Contains("pa=swaad@upi", result.UpiIntentUri);
        Assert.Contains("am=450.50", result.UpiIntentUri);
        Assert.NotNull(result.QrCodeSvgOrBase64);
        Assert.Contains("<svg", result.QrCodeSvgOrBase64);
    }

    [Fact]
    public void PaymentProviderFactory_ResolvesConcreteProvidersDynamically_SatisfyingOCP()
    {
        // Arrange
        var upiProvider = new UpiPaymentProvider();
        var razorpayProvider = new RazorpayPaymentProvider();
        var payuProvider = new PayUPaymentProvider();

        var factory = new PaymentProviderFactory(new IPaymentProvider[] { upiProvider, razorpayProvider, payuProvider });

        // Act & Assert
        var resolvedUpi = factory.GetProvider("UpiIntent");
        var resolvedRzp = factory.GetProvider("Razorpay");
        var resolvedPayu = factory.GetProvider("PayU");

        Assert.Equal("UpiIntent", resolvedUpi.ProviderName);
        Assert.Equal("Razorpay", resolvedRzp.ProviderName);
        Assert.Equal("PayU", resolvedPayu.ProviderName);
    }
}
