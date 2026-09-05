namespace MilkeKhao.Application.Common.Interfaces;

public interface IAggregatorDispatchClientFactory
{
    IAggregatorDispatchClient GetClient(string aggregatorName);
    IEnumerable<string> GetSupportedAggregators();
}
