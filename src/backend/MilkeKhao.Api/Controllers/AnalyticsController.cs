using Mediator;
using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Analytics.Queries;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AnalyticsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AnalyticsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("summary")]
    [ProducesResponseType(typeof(SalesSummaryDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSalesSummary(CancellationToken cancellationToken, [FromQuery] DateTimeOffset? startDate = null, [FromQuery] DateTimeOffset? endDate = null)
    {
        var query = new GetSalesSummaryQuery(startDate, endDate);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("top-items")]
    [ProducesResponseType(typeof(List<TopSellingItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTopSellingItems(CancellationToken cancellationToken, [FromQuery] int count = 5)
    {
        var query = new GetTopSellingItemsQuery(count);
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("delivery-modes")]
    [ProducesResponseType(typeof(List<DeliveryModeBreakdownDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDeliveryModeBreakdown(CancellationToken cancellationToken)
    {
        var query = new GetOrdersByDeliveryModeQuery();
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}
