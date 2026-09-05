namespace MilkeKhao.Application.Common.Interfaces;

/// <summary>
/// Distributed caching abstraction for tenant-scoped caching (menu catalogs, session states, feature settings).
/// </summary>
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
}
