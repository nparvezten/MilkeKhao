using Microsoft.EntityFrameworkCore;
using MilkeKhao.Api.Hubs;
using MilkeKhao.Api.Middleware;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Infrastructure.Dispatch;
using MilkeKhao.Infrastructure.Notifications;
using MilkeKhao.Infrastructure.Payments;
using MilkeKhao.Infrastructure.Persistence;
using MilkeKhao.Infrastructure.Security;
using MilkeKhao.Infrastructure.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog Structured Logging
builder.Host.UseSerilog((context, services, configuration) =>
{
    configuration
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console();
});

// Add HTTP Context Accessor & Tenant Context Service
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ITenantContext, TenantContext>();

// Add Database Context (PostgreSQL for Prod / InMemory for Dev)
builder.Services.AddDbContext<MilkeKhaoDbContext>((serviceProvider, options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connectionString) && connectionString.StartsWith("Host=", StringComparison.OrdinalIgnoreCase))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("MilkeKhaoDb");
    }
});

builder.Services.AddScoped<IMilkeKhaoDbContext>(provider => provider.GetRequiredService<MilkeKhaoDbContext>());

// Distributed Cache (Redis/Valkey with in-memory fallback)
var redisConnection = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnection) && !redisConnection.Contains("localhost:6379"))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnection;
        options.InstanceName = "MilkeKhao_";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}
builder.Services.AddSingleton<ICacheService, DistributedCacheService>();

// Add Mediator CQRS Engine (Scoped handlers to consume Scoped DbContext)
builder.Services.AddMediator(options =>
{
    options.ServiceLifetime = ServiceLifetime.Scoped;
});

// Add HttpClients
builder.Services.AddHttpClient();

// Phase 4: Register Payment Providers & Factory (OCP Compliant)
builder.Services.AddScoped<IPaymentProvider, UpiPaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, RazorpayPaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, PayUPaymentProvider>();
builder.Services.AddScoped<IPaymentProviderFactory, PaymentProviderFactory>();

// Phase 4: Register Aggregator Dispatch Clients & Factory (OCP Compliant)
builder.Services.AddScoped<IAggregatorDispatchClient, GenericWebhookAggregatorDispatchClient>();
builder.Services.AddScoped<IAggregatorDispatchClient, DunzoAggregatorDispatchClient>();
builder.Services.AddScoped<IAggregatorDispatchClient, ShadowfaxAggregatorDispatchClient>();
builder.Services.AddScoped<IAggregatorDispatchClientFactory, AggregatorDispatchClientFactory>();

// Phase 5: Register SignalR Hub & Multi-Channel Notification Dispatchers
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationDispatcher, SignalRNotificationDispatcher>();
builder.Services.AddScoped<IEmailNotificationSender, SmtpEmailNotificationSender>();
builder.Services.AddScoped<ISmsNotificationSender, TwilioSmsNotificationSender>();
builder.Services.AddScoped<IWhatsAppNotificationSender, WhatsAppCloudApiNotificationSender>();

// Phase 6: Register JWT Token Service & Auth Security
builder.Services.AddSingleton<IJwtTokenService>(new JwtTokenService(
    builder.Configuration["Jwt:SecretKey"] ?? "MilkeKhao_Super_Secret_Enterprise_JWT_Key_2026_Must_Be_At_Least_256_Bits!",
    builder.Configuration["Jwt:Issuer"] ?? "MilkeKhaoAPI",
    builder.Configuration["Jwt:Audience"] ?? "MilkeKhaoClients"
));

// Add CORS policy for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed initial default launch tenant and starter menu
using (var scope = app.Services.CreateScope())
{
    var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
    var dbContext = scope.ServiceProvider.GetRequiredService<MilkeKhaoDbContext>();

    dbContext.Database.EnsureCreated();
    var defaultTenantId = Guid.Parse("99999999-9999-9999-9999-999999999999");
    if (!dbContext.Tenants.Any(t => t.Id == defaultTenantId))
    {
        dbContext.Tenants.Add(new MilkeKhao.Domain.Entities.Tenant
        {
            Id = defaultTenantId,
            Name = "Swaad Foods (Delhi NCR)",
            Slug = "swaad-foods",
            Settings = new MilkeKhao.Domain.Entities.TenantFeatureSettings
            {
                EnabledDeliveryModes = new List<string> { "Pickup", "InHouseDelivery", "AggregatorDelivery" },
                EnabledPaymentMethods = new List<string> { "UpiIntent", "UpiQr", "Razorpay", "PayU" },
                MaxStaffAccounts = 1,
                GstRegistered = true
            }
        });
        dbContext.SaveChanges();
    }

    // Seed default categories & menu items if empty
    if (!dbContext.Categories.Any(c => c.TenantId == defaultTenantId))
    {
        var catMain = new MilkeKhao.Domain.Entities.Category { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Main Course", DisplayOrder = 1 };
        var catStarters = new MilkeKhao.Domain.Entities.Category { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Starters", DisplayOrder = 2 };
        var catBreads = new MilkeKhao.Domain.Entities.Category { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Breads & Rice", DisplayOrder = 3 };
        var catDesserts = new MilkeKhao.Domain.Entities.Category { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Desserts", DisplayOrder = 4 };
        var catBeverages = new MilkeKhao.Domain.Entities.Category { Id = Guid.NewGuid(), TenantId = defaultTenantId, Name = "Beverages", DisplayOrder = 5 };

        dbContext.Categories.AddRange(catMain, catStarters, catBreads, catDesserts, catBeverages);

        dbContext.MenuItems.AddRange(
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), TenantId = defaultTenantId, CategoryId = catMain.Id, Name = "Special Butter Chicken", Description = "Tender tandoori chicken simmered in rich tomato, butter & cashew gravy.", Price = new MilkeKhao.Domain.ValueObjects.Money(380.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), TenantId = defaultTenantId, CategoryId = catMain.Id, Name = "Paneer Butter Masala", Description = "Cottage cheese cubes tossed in creamy spiced onion-tomato velvet gravy.", Price = new MilkeKhao.Domain.ValueObjects.Money(320.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), TenantId = defaultTenantId, CategoryId = catStarters.Id, Name = "Amritsari Paneer Tikka", Description = "Charcoal grilled cottage cheese marinated in hung curd & secret spices.", Price = new MilkeKhao.Domain.ValueObjects.Money(290.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), TenantId = defaultTenantId, CategoryId = catMain.Id, Name = "Hyderabadi Chicken Dum Biryani", Description = "Long grain Basmati rice layered with spiced marinated chicken & saffron.", Price = new MilkeKhao.Domain.ValueObjects.Money(340.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), TenantId = defaultTenantId, CategoryId = catMain.Id, Name = "Dal Makhani Gold", Description = "Overnight slow cooked black lentils infused with white butter & cream.", Price = new MilkeKhao.Domain.ValueObjects.Money(280.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), TenantId = defaultTenantId, CategoryId = catBreads.Id, Name = "Butter Garlic Naan", Description = "Leavened flatbread freshly baked in tandoor with fresh garlic & melted butter.", Price = new MilkeKhao.Domain.ValueObjects.Money(65.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("77777777-7777-7777-7777-777777777777"), TenantId = defaultTenantId, CategoryId = catDesserts.Id, Name = "Gulab Jamun with Rabri", Description = "Hot milk-solid dumplings soaked in cardamom rose syrup served with rabri.", Price = new MilkeKhao.Domain.ValueObjects.Money(150.00m, "INR"), IsAvailable = true },
            new MilkeKhao.Domain.Entities.MenuItem { Id = Guid.Parse("88888888-8888-8888-8888-888888888888"), TenantId = defaultTenantId, CategoryId = catBeverages.Id, Name = "Kesari Mango Lassi", Description = "Chilled thick yogurt smoothie blended with Alphonso mango pulp & saffron.", Price = new MilkeKhao.Domain.ValueObjects.Money(120.00m, "INR"), IsAvailable = true }
        );
        dbContext.SaveChanges();
    }

    // Seed default live orders for KDS
    if (!dbContext.Orders.Any(o => o.TenantId == defaultTenantId))
    {
        var sampleCustomer = Guid.Parse("00000000-0000-0000-0000-000000000001");
        dbContext.Orders.AddRange(
            new MilkeKhao.Domain.Entities.Order
            {
                Id = Guid.Parse("c6517059-9889-42d3-91ea-ee427de46046"),
                TenantId = defaultTenantId,
                CustomerId = sampleCustomer,
                Status = MilkeKhao.Domain.Enums.OrderStatus.Pending,
                DeliveryMode = MilkeKhao.Domain.Enums.DeliveryMode.InHouseDelivery,
                PaymentMethod = MilkeKhao.Domain.Enums.PaymentMethod.UpiIntent,
                DeliveryAddress = new MilkeKhao.Domain.ValueObjects.Address("B-12, Connaught Place", "New Delhi", "Delhi", "110001"),
                TotalAmount = new MilkeKhao.Domain.ValueObjects.Money(510.00m, "INR"),
                IsPaid = true,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-12),
                Items = new List<MilkeKhao.Domain.ValueObjects.OrderItem>
                {
                    new MilkeKhao.Domain.ValueObjects.OrderItem(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Special Butter Chicken", new MilkeKhao.Domain.ValueObjects.Money(380.00m, "INR"), 1),
                    new MilkeKhao.Domain.ValueObjects.OrderItem(Guid.Parse("66666666-6666-6666-6666-666666666666"), "Butter Garlic Naan", new MilkeKhao.Domain.ValueObjects.Money(65.00m, "INR"), 2)
                }
            },
            new MilkeKhao.Domain.Entities.Order
            {
                Id = Guid.Parse("d7628160-0990-53e4-02fb-ff538ef57157"),
                TenantId = defaultTenantId,
                CustomerId = sampleCustomer,
                Status = MilkeKhao.Domain.Enums.OrderStatus.Accepted,
                DeliveryMode = MilkeKhao.Domain.Enums.DeliveryMode.Pickup,
                PaymentMethod = MilkeKhao.Domain.Enums.PaymentMethod.UpiQr,
                TotalAmount = new MilkeKhao.Domain.ValueObjects.Money(320.00m, "INR"),
                IsPaid = true,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-20),
                Items = new List<MilkeKhao.Domain.ValueObjects.OrderItem>
                {
                    new MilkeKhao.Domain.ValueObjects.OrderItem(Guid.Parse("22222222-2222-2222-2222-222222222222"), "Paneer Butter Masala", new MilkeKhao.Domain.ValueObjects.Money(320.00m, "INR"), 1)
                }
            },
            new MilkeKhao.Domain.Entities.Order
            {
                Id = Guid.Parse("e8739271-1aa1-64f5-13ac-aa649fa68268"),
                TenantId = defaultTenantId,
                CustomerId = sampleCustomer,
                Status = MilkeKhao.Domain.Enums.OrderStatus.Preparing,
                DeliveryMode = MilkeKhao.Domain.Enums.DeliveryMode.InHouseDelivery,
                PaymentMethod = MilkeKhao.Domain.Enums.PaymentMethod.UpiIntent,
                DeliveryAddress = new MilkeKhao.Domain.ValueObjects.Address("A-45, Green Park Main", "New Delhi", "Delhi", "110016"),
                TotalAmount = new MilkeKhao.Domain.ValueObjects.Money(280.00m, "INR"),
                IsPaid = true,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-28),
                Items = new List<MilkeKhao.Domain.ValueObjects.OrderItem>
                {
                    new MilkeKhao.Domain.ValueObjects.OrderItem(Guid.Parse("55555555-5555-5555-5555-555555555555"), "Dal Makhani Gold", new MilkeKhao.Domain.ValueObjects.Money(280.00m, "INR"), 1)
                }
            },
            new MilkeKhao.Domain.Entities.Order
            {
                Id = Guid.Parse("f984a382-2bb2-7506-24bd-bb75a0b79379"),
                TenantId = defaultTenantId,
                CustomerId = sampleCustomer,
                Status = MilkeKhao.Domain.Enums.OrderStatus.ReadyForPickup,
                DeliveryMode = MilkeKhao.Domain.Enums.DeliveryMode.Pickup,
                PaymentMethod = MilkeKhao.Domain.Enums.PaymentMethod.UpiIntent,
                TotalAmount = new MilkeKhao.Domain.ValueObjects.Money(340.00m, "INR"),
                IsPaid = true,
                CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-35),
                Items = new List<MilkeKhao.Domain.ValueObjects.OrderItem>
                {
                    new MilkeKhao.Domain.ValueObjects.OrderItem(Guid.Parse("44444444-4444-4444-4444-444444444444"), "Hyderabadi Chicken Dum Biryani", new MilkeKhao.Domain.ValueObjects.Money(340.00m, "INR"), 1)
                }
            }
        );
        dbContext.SaveChanges();
    }
}

// Enable CORS
app.UseCors();

// Global RFC 7807 ProblemDetails Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// Tenant Context Resolution Middleware (populates ITenantContext from JWT/Header)
app.UseMiddleware<TenantContextMiddleware>();

app.UseRouting();
app.UseAuthorization();

// Root API Health & Endpoint discovery
app.MapGet("/", () => Results.Ok(new
{
    status = "healthy",
    service = "MilkeKhao Enterprise Multi-Tenant API",
    version = "v1.0.0",
    timestamp = DateTimeOffset.UtcNow,
    endpoints = new[]
    {
        "/api/v1/tenants",
        "/api/v1/menu",
        "/api/v1/orders",
        "/api/v1/orders/kitchen/active",
        "/api/v1/payments/initiate",
        "/api/v1/analytics/summary",
        "/openapi/v1.json",
        "/hubs/orders"
    }
}));

app.MapOpenApi();
app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders");

app.Run();
