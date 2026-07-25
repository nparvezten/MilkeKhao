using Microsoft.AspNetCore.Mvc;
using MilkeKhao.Application.Common.Interfaces;

namespace MilkeKhao.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class DriversController : ControllerBase
{
    private readonly IAggregatorDispatchClient _aggregatorDispatchClient;

    public DriversController(IAggregatorDispatchClient aggregatorDispatchClient)
    {
        _aggregatorDispatchClient = aggregatorDispatchClient;
    }

    [HttpGet("dispatch-status")]
    public IActionResult GetDispatchStatus()
    {
        return Ok(new
        {
            AggregatorName = _aggregatorDispatchClient.AggregatorName,
            Status = "Active Dispatch Client Connected"
        });
    }
}
