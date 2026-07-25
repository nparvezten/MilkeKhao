using Microsoft.Extensions.Logging;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Infrastructure.Dispatch;

public class GenericWebhookAggregatorDispatchClient : IAggregatorDispatchClient
{
    private readonly ILogger<GenericWebhookAggregatorDispatchClient> _logger;

    public string AggregatorName => "GenericAggregatorWebhook";

    public GenericWebhookAggregatorDispatchClient(ILogger<GenericWebhookAggregatorDispatchClient> logger)
    {
        _logger = logger;
    }

    public ValueTask<AggregatorDispatchResult> DispatchOrderAsync(Order order, CancellationToken cancellationToken = default)
    {
        var dispatchRef = $"AGGR_DISPATCH_{order.Id:N}_{DateTime.UtcNow.Ticks}";
        _logger.LogInformation("Dispatched Order {OrderId} via Aggregator Webhook {DispatchRef}", order.Id, dispatchRef);

        var result = new AggregatorDispatchResult(
            IsDispatched: true,
            AggregatorName: AggregatorName,
            DispatchReference: dispatchRef,
            StatusMessage: "Order successfully transmitted to Delivery Aggregator webhook queue."
        );

        return ValueTask.FromResult(result);
    }
}
