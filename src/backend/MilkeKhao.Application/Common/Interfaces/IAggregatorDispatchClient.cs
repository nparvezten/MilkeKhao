using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Application.Common.Interfaces;

public record AggregatorDispatchResult(
    bool IsDispatched,
    string AggregatorName,
    string DispatchReference,
    string StatusMessage
);

public interface IAggregatorDispatchClient
{
    string AggregatorName { get; }
    ValueTask<AggregatorDispatchResult> DispatchOrderAsync(Order order, CancellationToken cancellationToken = default);
}
