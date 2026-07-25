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
    if (!string.IsNullOrEmpty(connectionString) && connectionString.Contains("Host="))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseInMemoryDatabase("MilkeKhaoDb");
    }
});

builder.Services.AddScoped<IMilkeKhaoDbContext>(provider => provider.GetRequiredService<MilkeKhaoDbContext>());

// Add Mediator CQRS Engine
builder.Services.AddMediator();

// Phase 4: Register Payment Providers & Factory (OCP Compliant)
builder.Services.AddScoped<IPaymentProvider, UpiPaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, RazorpayPaymentProvider>();
builder.Services.AddScoped<IPaymentProvider, PayUPaymentProvider>();
builder.Services.AddScoped<IPaymentProviderFactory, PaymentProviderFactory>();

// Phase 6: Register Aggregator Dispatch Client (OCP Compliant)
builder.Services.AddScoped<IAggregatorDispatchClient, GenericWebhookAggregatorDispatchClient>();

// Phase 5: Register SignalR Hub & Notification Dispatchers
builder.Services.AddSignalR();
builder.Services.AddScoped<INotificationDispatcher, SignalRNotificationDispatcher>();
builder.Services.AddScoped<IEmailNotificationSender, MockEmailNotificationSender>();
builder.Services.AddScoped<ISmsNotificationSender, MockSmsNotificationSender>();

// Phase 6: Register JWT Token Service & Auth Security
builder.Services.AddSingleton<IJwtTokenService>(new JwtTokenService(
    builder.Configuration["Jwt:SecretKey"] ?? "MilkeKhao_Super_Secret_Enterprise_JWT_Key_2026_Must_Be_At_Least_256_Bits!",
    builder.Configuration["Jwt:Issuer"] ?? "MilkeKhaoAPI",
    builder.Configuration["Jwt:Audience"] ?? "MilkeKhaoClients"
));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

var app = builder.Build();

// Seed initial default launch tenant
using (var scope = app.Services.CreateScope())
{
    var tenantContext = scope.ServiceProvider.GetRequiredService<ITenantContext>();
    var dbContext = scope.ServiceProvider.GetRequiredService<MilkeKhaoDbContext>();

    dbContext.Database.EnsureCreated();
    if (!dbContext.Tenants.Any())
    {
        dbContext.Tenants.Add(new MilkeKhao.Domain.Entities.Tenant
        {
            Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            Name = "Swaad Foods (Delhi NCR)",
            Slug = "swaad-foods",
            Settings = new MilkeKhao.Domain.Entities.TenantFeatureSettings
            {
                EnabledDeliveryModes = new List<string> { "Pickup", "InHouseDelivery" },
                EnabledPaymentMethods = new List<string> { "UpiIntent", "UpiQr" },
                MaxStaffAccounts = 1,
                GstRegistered = true
            }
        });
        dbContext.SaveChanges();
    }
}

// Global RFC 7807 ProblemDetails Exception Handling Middleware
app.UseMiddleware<GlobalExceptionMiddleware>();

// Tenant Context Resolution Middleware (populates ITenantContext from JWT/Header)
app.UseMiddleware<TenantContextMiddleware>();

app.UseRouting();
app.UseAuthorization();

app.MapControllers();
app.MapHub<OrderHub>("/hubs/orders");

app.Run();
