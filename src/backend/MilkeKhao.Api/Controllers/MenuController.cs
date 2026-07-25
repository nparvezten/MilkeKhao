using Mediator;
using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Menu.Commands;
using MilkeKhao.Application.Menu.DTOs;
using MilkeKhao.Application.Menu.Queries;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class MenuController : ControllerBase
{
    private readonly IMediator _mediator;

    public MenuController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<MenuItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveMenu(CancellationToken cancellationToken)
    {
        var query = new GetActiveMenuQuery();
        var result = await _mediator.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(MenuItemDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateMenuItem([FromBody] CreateMenuItemCommand command, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetActiveMenu), null, result);
    }

    [HttpPut("{id:guid}/toggle-availability")]
    [ProducesResponseType(typeof(MenuItemDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ToggleMenuItemAvailability([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new ToggleMenuItemAvailabilityCommand(id);
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }
}
