using Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Tenants;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/tenants")]
public class TenantsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IMilkeKhaoDbContext _dbContext;

    public TenantsController(IMediator mediator, IMilkeKhaoDbContext dbContext)
    {
        _mediator = mediator;
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> GetTenants(CancellationToken cancellationToken)
    {
        var tenants = await _dbContext.Tenants
            .AsNoTracking()
            .Where(t => t.IsActive)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Slug,
                Settings = new
                {
                    t.Settings.EnabledDeliveryModes,
                    t.Settings.EnabledPaymentMethods,
                    t.Settings.GstRegistered
                }
            })
            .ToListAsync(cancellationToken);

        return Ok(tenants);
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterTenant([FromBody] RegisterTenantCommand command, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Created($"/api/v1/tenants/{result.TenantId}", result);
    }
}
