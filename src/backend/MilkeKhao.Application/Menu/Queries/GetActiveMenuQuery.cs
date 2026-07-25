using Mediator;
using MilkeKhao.Application.Menu.DTOs;

namespace MilkeKhao.Application.Menu.Queries;

public record GetActiveMenuQuery() : IQuery<List<MenuItemDto>>;
