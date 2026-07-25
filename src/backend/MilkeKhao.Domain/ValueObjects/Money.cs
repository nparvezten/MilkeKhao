namespace MilkeKhao.Domain.ValueObjects;

public record Money(decimal Amount, string Currency = "INR")
{
    public static Money Zero => new Money(0m);

    public static Money operator +(Money a, Money b) =>
        a.Currency == b.Currency
            ? new Money(a.Amount + b.Amount, a.Currency)
            : throw new InvalidOperationException("Cannot add money of different currencies.");

    public static Money operator *(Money a, int multiplier) =>
        new Money(a.Amount * multiplier, a.Currency);
}
