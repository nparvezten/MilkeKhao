namespace MilkeKhao.Domain.ValueObjects;

public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid MenuItemId { get; set; }
    public string MenuItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public string Currency { get; set; } = "INR";
    public int Quantity { get; set; }

    public Money SubTotal => new Money(UnitPrice * Quantity, Currency);

    public OrderItem() { }

    public OrderItem(Guid menuItemId, string menuItemName, Money unitPrice, int quantity)
    {
        Id = Guid.NewGuid();
        MenuItemId = menuItemId;
        MenuItemName = menuItemName;
        UnitPrice = unitPrice.Amount;
        Currency = unitPrice.Currency;
        Quantity = quantity;
    }
}
