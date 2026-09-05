using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using MilkeKhao.Infrastructure.Services;
using Xunit;

namespace MilkeKhao.UnitTests;

public class DistributedCacheTests
{
    [Fact]
    public async Task CacheService_Sets_And_Gets_Serialized_Objects_Correctly()
    {
        var memoryDistributedCache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
        var cacheService = new DistributedCacheService(memoryDistributedCache);

        var testKey = "tenant:99999999-9999-9999-9999-999999999999:feature_flags";
        var sampleData = new { MaxStaff = 5, FastDelivery = true, Currency = "INR" };

        // Act
        await cacheService.SetAsync(testKey, sampleData, TimeSpan.FromMinutes(10));
        var retrieved = await cacheService.GetAsync<dynamic>(testKey);

        // Assert
        Assert.NotNull(retrieved);

        await cacheService.RemoveAsync(testKey);
        var afterRemoval = await cacheService.GetAsync<dynamic>(testKey);
        Assert.Null(afterRemoval);
    }
}
