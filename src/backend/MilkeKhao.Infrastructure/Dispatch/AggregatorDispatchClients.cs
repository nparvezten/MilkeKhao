using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Infrastructure.Dispatch;

/// <summary>
/// Dunzo B2B Delivery Aggregator client adapter.
/// </summary>
public class DunzoAggregatorDispatchClient : IAggregatorDispatchClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DunzoAggregatorDispatchClient> _logger;

    public string AggregatorName => "Dunzo";

    public DunzoAggregatorDispatchClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<DunzoAggregatorDispatchClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask<AggregatorDispatchResult> DispatchOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        var apiUrl = _configuration["Aggregators:Dunzo:ApiUrl"] ?? "https://api.dunzo.in/api/v1";
        var clientId = _configuration["Aggregators:Dunzo:ClientId"];
        var clientSecret = _configuration["Aggregators:Dunzo:ClientSecret"];

        var dispatchRef = $"DNZ_{order.Id:N}_{DateTime.UtcNow.Ticks}";

        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            _logger.LogInformation("[Dunzo Sandbox Simulation] Order {OrderId} dispatched with reference {DispatchRef}", order.Id, dispatchRef);
            return new AggregatorDispatchResult(
                IsDispatched: true,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: "Dispatched to Dunzo Delivery Fleet (Sandbox Simulation)"
            );
        }

        try
        {
            var payload = new
            {
                request_id = dispatchRef,
                pickup_details = new
                {
                    reference_id = $"STORE_{order.TenantId:N}",
                    address = new { street_address_1 = "Restaurant Kitchen Location" }
                },
                drop_details = new
                {
                    address = new
                    {
                        street_address_1 = order.DeliveryAddress.Street,
                        city = order.DeliveryAddress.City,
                        postal_code = order.DeliveryAddress.PostalCode
                    }
                },
                payment_method = "PREPAID"
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{apiUrl}/tasks")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Add("client-id", clientId);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", clientSecret);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully created Dunzo task for Order {OrderId}", order.Id);
                return new AggregatorDispatchResult(
                    IsDispatched: true,
                    AggregatorName: AggregatorName,
                    DispatchReference: dispatchRef,
                    StatusMessage: "Dunzo Task Created Successfully"
                );
            }

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Dunzo Task creation failed with status {StatusCode}: {Error}", response.StatusCode, error);
            return new AggregatorDispatchResult(
                IsDispatched: false,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: $"Dunzo API Error: {response.StatusCode}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception dispatching order {OrderId} to Dunzo", order.Id);
            return new AggregatorDispatchResult(
                IsDispatched: false,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: $"Dunzo Dispatch Exception: {ex.Message}"
            );
        }
    }
}

/// <summary>
/// Shadowfax Flash B2B Delivery Aggregator client adapter.
/// </summary>
public class ShadowfaxAggregatorDispatchClient : IAggregatorDispatchClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ShadowfaxAggregatorDispatchClient> _logger;

    public string AggregatorName => "Shadowfax";

    public ShadowfaxAggregatorDispatchClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<ShadowfaxAggregatorDispatchClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async ValueTask<AggregatorDispatchResult> DispatchOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        var apiUrl = _configuration["Aggregators:Shadowfax:ApiUrl"] ?? "https://flash-api.shadowfax.in/api/v2";
        var apiKey = _configuration["Aggregators:Shadowfax:ApiKey"];

        var dispatchRef = $"SFX_{order.Id:N}_{DateTime.UtcNow.Ticks}";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogInformation("[Shadowfax Sandbox Simulation] Order {OrderId} dispatched with reference {DispatchRef}", order.Id, dispatchRef);
            return new AggregatorDispatchResult(
                IsDispatched: true,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: "Dispatched to Shadowfax Flash Delivery (Sandbox Simulation)"
            );
        }

        try
        {
            var payload = new
            {
                order_details = new
                {
                    order_id = dispatchRef,
                    client_order_id = order.Id.ToString(),
                    paid = true
                },
                drop_details = new
                {
                    address = $"{order.DeliveryAddress.Street}, {order.DeliveryAddress.City} - {order.DeliveryAddress.PostalCode}"
                }
            };

            var request = new HttpRequestMessage(HttpMethod.Post, $"{apiUrl}/orders")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Token", apiKey);

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully created Shadowfax order for Order {OrderId}", order.Id);
                return new AggregatorDispatchResult(
                    IsDispatched: true,
                    AggregatorName: AggregatorName,
                    DispatchReference: dispatchRef,
                    StatusMessage: "Shadowfax Order Dispatched Successfully"
                );
            }

            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Shadowfax Order creation failed with status {StatusCode}: {Error}", response.StatusCode, error);
            return new AggregatorDispatchResult(
                IsDispatched: false,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: $"Shadowfax API Error: {response.StatusCode}"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception dispatching order {OrderId} to Shadowfax", order.Id);
            return new AggregatorDispatchResult(
                IsDispatched: false,
                AggregatorName: AggregatorName,
                DispatchReference: dispatchRef,
                StatusMessage: $"Shadowfax Dispatch Exception: {ex.Message}"
            );
        }
    }
}

/// <summary>
/// Dynamic factory for resolving Aggregator Dispatch Clients.
/// </summary>
public class AggregatorDispatchClientFactory : IAggregatorDispatchClientFactory
{
    private readonly IEnumerable<IAggregatorDispatchClient> _clients;

    public AggregatorDispatchClientFactory(IEnumerable<IAggregatorDispatchClient> clients)
    {
        _clients = clients;
    }

    public IAggregatorDispatchClient GetClient(string aggregatorName)
    {
        var client = _clients.FirstOrDefault(c => string.Equals(c.AggregatorName, aggregatorName, StringComparison.OrdinalIgnoreCase));
        if (client == null)
        {
            return _clients.First(c => c.AggregatorName == "GenericAggregatorWebhook");
        }
        return client;
    }

    public IEnumerable<string> GetSupportedAggregators()
    {
        return _clients.Select(c => c.AggregatorName);
    }
}
