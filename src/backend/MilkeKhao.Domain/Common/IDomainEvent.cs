namespace MilkeKhao.Domain.Common;

public interface IDomainEvent
{
    DateTimeOffset OccurredOn { get; }
}
