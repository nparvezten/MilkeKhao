using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Notifications;

/// <summary>
/// Twilio SMS notification sender via HTTP REST API.
/// </summary>
public class TwilioSmsNotificationSender : ISmsNotificationSender
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TwilioSmsNotificationSender> _logger;

    public TwilioSmsNotificationSender(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<TwilioSmsNotificationSender> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask SendSmsAsync(string recipientPhoneNumber, string message, CancellationToken cancellationToken = default)
    {
        var accountSid = _configuration["Twilio:AccountSid"];
        var authToken = _configuration["Twilio:AuthToken"];
        var fromNumber = _configuration["Twilio:FromPhoneNumber"] ?? "+15005550006";

        if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken))
        {
            _logger.LogInformation("[Twilio Simulation] SMS to: {Recipient} | Text: {Message}", recipientPhoneNumber, message);
            return;
        }

        try
        {
            var requestUrl = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";
            var formContent = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("To", recipientPhoneNumber),
                new KeyValuePair<string, string>("From", fromNumber),
                new KeyValuePair<string, string>("Body", message)
            });

            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
            {
                Content = formContent
            };
            var authHeader = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", authHeader);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully dispatched SMS to {Recipient} via Twilio", recipientPhoneNumber);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Twilio SMS dispatch returned status {StatusCode}: {Error}", response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send SMS to {Recipient} via Twilio", recipientPhoneNumber);
        }
    }
}

/// <summary>
/// WhatsApp Cloud API notification sender via Meta Graph API.
/// </summary>
public class WhatsAppCloudApiNotificationSender : IWhatsAppNotificationSender
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<WhatsAppCloudApiNotificationSender> _logger;

    public WhatsAppCloudApiNotificationSender(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<WhatsAppCloudApiNotificationSender> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask SendWhatsAppMessageAsync(string recipientPhoneNumber, string message, CancellationToken cancellationToken = default)
    {
        var apiUrl = _configuration["WhatsApp:ApiUrl"] ?? "https://graph.facebook.com/v18.0";
        var phoneNumberId = _configuration["WhatsApp:PhoneNumberId"];
        var accessToken = _configuration["WhatsApp:AccessToken"];

        if (string.IsNullOrEmpty(phoneNumberId) || string.IsNullOrEmpty(accessToken))
        {
            _logger.LogInformation("[WhatsApp Simulation] Message to: {Recipient} | Text: {Message}", recipientPhoneNumber, message);
            return;
        }

        try
        {
            var requestUrl = $"{apiUrl}/{phoneNumberId}/messages";
            var payload = new
            {
                messaging_product = "whatsapp",
                to = recipientPhoneNumber.Replace("+", "").Replace("-", "").Trim(),
                type = "text",
                text = new { preview_url = false, body = message }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, requestUrl)
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully sent WhatsApp message to {Recipient}", recipientPhoneNumber);
            }
            else
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("WhatsApp API returned status {StatusCode}: {Error}", response.StatusCode, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send WhatsApp message to {Recipient}", recipientPhoneNumber);
        }
    }
}
