using Mediator;
using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Application.Payments.Commands;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;

    public PaymentsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("initiate")]
    [ProducesResponseType(typeof(PaymentInitiationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> InitiatePayment([FromBody] InitiatePaymentCommand command, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("webhook/{provider}")]
    [ProducesResponseType(typeof(PaymentVerificationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> HandleWebhook(
        [FromRoute] string provider,
        [FromQuery] string transactionId,
        [FromBody] Dictionary<string, string> payload,
        CancellationToken cancellationToken)
    {
        var command = new VerifyPaymentWebhookCommand(provider, transactionId, payload);
        var result = await _mediator.Send(command, cancellationToken);

        if (!result.IsSuccess)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
