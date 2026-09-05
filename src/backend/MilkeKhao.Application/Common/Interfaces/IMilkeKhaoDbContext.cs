using Microsoft.EntityFrameworkCore;
using MilkeKhao.Domain.Entities;

namespace MilkeKhao.Application.Common.Interfaces;

public interface IMilkeKhaoDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<Category> Categories { get; }
    DbSet<MenuItem> MenuItems { get; }
    DbSet<User> Users { get; }
    DbSet<Driver> Drivers { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderStatusHistory> OrderStatusHistories { get; }
    DbSet<Coupon> Coupons { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
