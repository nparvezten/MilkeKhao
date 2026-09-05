using Mediator;
using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Coupons;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/coupons")]
public class CouponsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CouponsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponQuery query, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(query, cancellationToken);
        if (!result.IsValid)
        {
            return BadRequest(result);
        }
        return Ok(result);
    }
}
