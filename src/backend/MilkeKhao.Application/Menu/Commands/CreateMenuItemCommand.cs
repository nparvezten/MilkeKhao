using FluentValidation;
using Mediator;
using MilkeKhao.Application.Menu.DTOs;

namespace MilkeKhao.Application.Menu.Commands;

public record CreateMenuItemCommand(
    Guid CategoryId,
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl
) : ICommand<MenuItemDto>;

public class CreateMenuItemCommandValidator : AbstractValidator<CreateMenuItemCommand>
{
    public CreateMenuItemCommandValidator()
    {
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Price).GreaterThan(0);
    }
}
