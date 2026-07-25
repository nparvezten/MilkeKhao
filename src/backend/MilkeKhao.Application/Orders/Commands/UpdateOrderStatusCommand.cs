using FluentValidation;
using Mediator;
using MilkeKhao.Application.Orders.DTOs;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Orders.Commands;

public record UpdateOrderStatusCommand(
    Guid OrderId,
    OrderStatus NewStatus,
    Guid? PerformedByUserId = null,
    string? Notes = null
) : ICommand<OrderDto>;

public class UpdateOrderStatusCommandValidator : AbstractValidator<UpdateOrderStatusCommand>
{
    public UpdateOrderStatusCommandValidator()
    {
        RuleFor(x => x.OrderId).NotEmpty();
        RuleFor(x => x.NewStatus).IsInEnum();
    }
}
