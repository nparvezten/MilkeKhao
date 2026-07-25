using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Payments;

public class PaymentProviderFactory : IPaymentProviderFactory
{
    private readonly IDictionary<string, IPaymentProvider> _providers;

    public PaymentProviderFactory(IEnumerable<IPaymentProvider> providers)
    {
        _providers = providers.ToDictionary(
            p => p.ProviderName,
            p => p,
            StringComparer.OrdinalIgnoreCase
        );
    }

    public IPaymentProvider GetProvider(string providerName)
    {
        if (_providers.TryGetValue(providerName, out var provider))
        {
            return provider;
        }

        // Fallback to launch default UPI Intent provider if requested provider is unavailable
        if (_providers.TryGetValue("UpiIntent", out var defaultProvider))
        {
            return defaultProvider;
        }

        throw new KeyNotFoundException($"Payment provider '{providerName}' is not registered or supported.");
    }

    public IEnumerable<IPaymentProvider> GetAllAvailableProviders()
    {
        return _providers.Values;
    }
}
