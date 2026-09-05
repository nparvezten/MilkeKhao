using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using MilkeKhao.Infrastructure.Payments;
using Xunit;

namespace MilkeKhao.UnitTests;

public class PaymentVerificationDeepTests
{
    [Fact]
    public async Task Razorpay_HMAC_Signature_Verification_Succeeds_For_Valid_Signature()
    {
        var secret = "rzp_live_secret_key_12345";
        var inMemoryConfig = new Dictionary<string, string?>
        {
            { "PaymentProviders:Razorpay:KeySecret", secret }
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var provider = new RazorpayPaymentProvider(configuration);

        var transactionId = "rzp_order_test_998877";
        var paymentId = "pay_9876543210_abc";

        // Compute valid HMAC-SHA256 signature
        var dataToSign = $"{transactionId}|{paymentId}";
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var validSignature = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(dataToSign))).ToLowerInvariant();

        var payload = new Dictionary<string, string>
        {
            { "razorpay_payment_id", paymentId },
            { "razorpay_signature", validSignature }
        };

        // Act
        var result = await provider.VerifyPaymentAsync(transactionId, payload, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(paymentId, result.ProviderReference);
        Assert.Contains("HMAC Signature", result.StatusMessage);
    }

    [Fact]
    public async Task Razorpay_Verification_Fails_When_Signature_Is_Tampered()
    {
        var secret = "rzp_live_secret_key_12345";
        var inMemoryConfig = new Dictionary<string, string?>
        {
            { "PaymentProviders:Razorpay:KeySecret", secret }
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var provider = new RazorpayPaymentProvider(configuration);

        var payload = new Dictionary<string, string>
        {
            { "razorpay_payment_id", "pay_real_id" },
            { "razorpay_signature", "invalid_tampered_signature_hex" }
        };

        // Act
        var result = await provider.VerifyPaymentAsync("rzp_order_123", payload, CancellationToken.None);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Failed", result.StatusMessage);
    }

    [Fact]
    public async Task PayU_SHA512_Hash_Verification_Succeeds_For_Valid_Checksum()
    {
        var salt = "payu_test_salt_secure_99";
        var inMemoryConfig = new Dictionary<string, string?>
        {
            { "PaymentProviders:PayU:Salt", salt }
        };
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(inMemoryConfig).Build();
        var provider = new PayUPaymentProvider(configuration);

        var transactionId = "payu_tx_order_123";
        var payuId = "mih_99887766";
        var status = "success";
        var email = "rahul@example.com";
        var firstName = "Rahul";
        var productInfo = "MilkeKhao Order";
        var amount = "450.00";
        var key = "test_key";

        var rawHashSequence = $"{salt}|{status}|||||||||||{email}|{firstName}|{productInfo}|{amount}|{transactionId}|{key}";
        using var sha = SHA512.Create();
        var computedHash = Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(rawHashSequence))).ToLowerInvariant();

        var payload = new Dictionary<string, string>
        {
            { "mihpayid", payuId },
            { "status", status },
            { "email", email },
            { "firstname", firstName },
            { "productinfo", productInfo },
            { "amount", amount },
            { "key", key },
            { "hash", computedHash }
        };

        // Act
        var result = await provider.VerifyPaymentAsync(transactionId, payload, CancellationToken.None);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(payuId, result.ProviderReference);
    }
}
