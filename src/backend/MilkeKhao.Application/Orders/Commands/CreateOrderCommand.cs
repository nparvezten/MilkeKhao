using FluentValidation;
using Mediator;
using MilkeKhao.Application.Orders.DTOs;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Orders.Commands;

public record CreateOrderItemRequest(
    Guid MenuItemId,
    int Quantity
);

public record CreateOrderCommand(
    Guid CustomerId,
    DeliveryMode DeliveryMode,
    PaymentMethod PaymentMethod,
    AddressDto? DeliveryAddress,
    List<CreateOrderItemRequest> Items
) : ICommand<OrderDto>;

public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.CustomerId).NotEmpty();
        RuleFor(x => x.DeliveryMode).IsInEnum();
        RuleFor(x => x.PaymentMethod).IsInEnum();
        RuleFor(x => x.Items).NotEmpty().WithMessage("Order must contain at least one item.");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.MenuItemId).NotEmpty();
            item.RuleFor(i => i.Quantity).GreaterThan(0);
        });

        When(x => x.DeliveryMode == DeliveryMode.InHouseDelivery || x.DeliveryMode == DeliveryMode.AggregatorDelivery, () =>
        {
            RuleFor(x => x.DeliveryAddress).NotNull().WithMessage("Delivery address is required for delivery orders.");
        });
    }
}
