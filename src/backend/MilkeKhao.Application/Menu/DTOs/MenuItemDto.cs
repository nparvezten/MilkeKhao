namespace MilkeKhao.Application.Menu.DTOs;

public record MenuItemDto(
    Guid Id,
    Guid TenantId,
    Guid CategoryId,
    string Name,
    string Description,
    decimal Price,
    string Currency,
    string? ImageUrl,
    bool IsAvailable
);
