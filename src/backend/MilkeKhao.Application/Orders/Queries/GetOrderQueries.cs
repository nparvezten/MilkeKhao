using Mediator;
using MilkeKhao.Application.Orders.DTOs;

namespace MilkeKhao.Application.Orders.Queries;

public record GetOrderByIdQuery(Guid OrderId) : IQuery<OrderDto?>;

public record GetKitchenActiveOrdersQuery() : IQuery<List<OrderDto>>;
