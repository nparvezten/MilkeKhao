namespace MilkeKhao.Application.Common.Interfaces;

public interface IPaymentProviderFactory
{
    IPaymentProvider GetProvider(string providerName);
    IEnumerable<IPaymentProvider> GetAllAvailableProviders();
}
