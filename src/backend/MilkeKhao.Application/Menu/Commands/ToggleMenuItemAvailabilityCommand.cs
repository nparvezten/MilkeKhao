using FluentValidation;
using Mediator;

namespace MilkeKhao.Application.Menu.Commands;

public record ToggleMenuItemAvailabilityCommand(
    Guid MenuItemId
) : ICommand<bool>;

public class ToggleMenuItemAvailabilityCommandValidator : AbstractValidator<ToggleMenuItemAvailabilityCommand>
{
    public ToggleMenuItemAvailabilityCommandValidator()
    {
        RuleFor(x => x.MenuItemId).NotEmpty();
    }
}
