using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Notifications;

/// <summary>
/// Production SMTP email notification sender using standard System.Net.Mail.
/// </summary>
public class SmtpEmailNotificationSender : IEmailNotificationSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailNotificationSender> _logger;

    public SmtpEmailNotificationSender(
        IConfiguration configuration,
        ILogger<SmtpEmailNotificationSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask SendEmailAsync(string recipientEmail, string subject, string body, CancellationToken cancellationToken = default)
    {
        var host = _configuration["Smtp:Host"];
        var port = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
        var enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;
        var userName = _configuration["Smtp:UserName"];
        var password = _configuration["Smtp:Password"];
        var fromEmail = _configuration["Smtp:FromEmail"] ?? "orders@milkekhao.com";
        var fromName = _configuration["Smtp:FromName"] ?? "MilkeKhao Orders";

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(userName))
        {
            _logger.LogInformation("[SMTP Simulation] Email to: {Recipient} | Subject: {Subject} | Body Length: {Length}", recipientEmail, subject, body.Length);
            return;
        }

        try
        {
            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Credentials = new NetworkCredential(userName, password)
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mailMessage.To.Add(recipientEmail);

            await client.SendMailAsync(mailMessage, cancellationToken);
            _logger.LogInformation("Successfully sent email to {Recipient} via SMTP ({Host})", recipientEmail, host);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient} via SMTP", recipientEmail);
        }
    }
}
