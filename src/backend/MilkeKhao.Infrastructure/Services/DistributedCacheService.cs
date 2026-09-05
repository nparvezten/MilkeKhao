using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Infrastructure.Services;

/// <summary>
/// Distributed cache implementation wrapping IDistributedCache (Redis/Valkey).
/// </summary>
public class DistributedCacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private readonly JsonSerializerOptions _jsonOptions;

    public DistributedCacheService(IDistributedCache cache)
    {
        _cache = cache;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var cachedData = await _cache.GetStringAsync(key, cancellationToken);
        if (string.IsNullOrEmpty(cachedData))
        {
            return default;
        }

        return JsonSerializer.Deserialize<T>(cachedData, _jsonOptions);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var serialized = JsonSerializer.Serialize(value, _jsonOptions);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(30)
        };

        await _cache.SetStringAsync(key, serialized, options, cancellationToken);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await _cache.RemoveAsync(key, cancellationToken);
    }
}
