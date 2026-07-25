using Mediator;
using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Orders.Commands;
using MilkeKhao.Application.Orders.DTOs;
using MilkeKhao.Application.Orders.Queries;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var query = new GetOrderByIdQuery(id);
        var result = await _mediator.Send(query, cancellationToken);
        if (result == null) return NotFound();
        return Ok(result);
    }

    [HttpGet("kitchen/active")]
    [ProducesResponseType(typeof(List<OrderDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetKitchenActiveOrders(CancellationToken cancellationToken)
    {
        var query = new GetKitchenActiveOrdersQuery();
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}/status")]
    [ProducesResponseType(typeof(OrderDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateOrderStatus(
        [FromRoute] Guid id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var command = new UpdateOrderStatusCommand(id, request.NewStatus, request.PerformedByUserId, request.Notes);
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}

public record UpdateOrderStatusRequest(
    OrderStatus NewStatus,
    Guid? PerformedByUserId,
    string? Notes
);
