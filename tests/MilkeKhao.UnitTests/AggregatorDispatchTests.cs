using Microsoft.Extensions.Logging.Abstractions;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Entities;
using MilkeKhao.Domain.Enums;
using MilkeKhao.Domain.ValueObjects;
using MilkeKhao.Infrastructure.Dispatch;
using Xunit;

namespace MilkeKhao.UnitTests;

public class AggregatorDispatchTests
{
    [Fact]
    public async Task Dunzo_And_Shadowfax_Dispatch_Clients_Return_Valid_Dispatch_References()
    {
        var tenantId = Guid.NewGuid();
        var order = new Order
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            DeliveryMode = DeliveryMode.AggregatorDelivery,
            DeliveryAddress = new Address("42 Connaught Place", "New Delhi", "110001", "Near Metro Gate 2")
        };

        var genericClient = new GenericWebhookAggregatorDispatchClient(NullLogger<GenericWebhookAggregatorDispatchClient>.Instance);
        var dunzoClient = new DunzoAggregatorDispatchClient(new HttpClient(), new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), NullLogger<DunzoAggregatorDispatchClient>.Instance);
        var shadowfaxClient = new ShadowfaxAggregatorDispatchClient(new HttpClient(), new Microsoft.Extensions.Configuration.ConfigurationBuilder().Build(), NullLogger<ShadowfaxAggregatorDispatchClient>.Instance);

        var factory = new AggregatorDispatchClientFactory(new IAggregatorDispatchClient[] { genericClient, dunzoClient, shadowfaxClient });

        // Act
        var resolvedDunzo = factory.GetClient("Dunzo");
        var dunzoResult = await resolvedDunzo.DispatchOrderAsync(order);

        var resolvedShadowfax = factory.GetClient("Shadowfax");
        var shadowfaxResult = await resolvedShadowfax.DispatchOrderAsync(order);

        // Assert
        Assert.Equal("Dunzo", resolvedDunzo.AggregatorName);
        Assert.True(dunzoResult.IsDispatched);
        Assert.StartsWith("DNZ_", dunzoResult.DispatchReference);

        Assert.Equal("Shadowfax", resolvedShadowfax.AggregatorName);
        Assert.True(shadowfaxResult.IsDispatched);
        Assert.StartsWith("SFX_", shadowfaxResult.DispatchReference);
    }
}
