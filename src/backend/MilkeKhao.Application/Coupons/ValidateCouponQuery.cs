using Mediator;
using Microsoft.EntityFrameworkCore;
using MilkeKhao.Application.Common.Interfaces;
using MilkeKhao.Domain.Enums;

namespace MilkeKhao.Application.Coupons;

public record ValidateCouponQuery(
    string Code,
    decimal OrderSubtotal
) : IRequest<CouponValidationResult>;

public record CouponValidationResult(
    bool IsValid,
    string Code,
    decimal DiscountAmount,
    decimal FinalTotal,
    string Message
);

public class ValidateCouponQueryHandler : IRequestHandler<ValidateCouponQuery, CouponValidationResult>
{
    private readonly IMilkeKhaoDbContext _dbContext;
    private readonly ITenantContext _tenantContext;

    public ValidateCouponQueryHandler(IMilkeKhaoDbContext dbContext, ITenantContext tenantContext)
    {
        _dbContext = dbContext;
        _tenantContext = tenantContext;
    }

    public async ValueTask<CouponValidationResult> Handle(ValidateCouponQuery request, CancellationToken cancellationToken)
    {
        var cleanCode = request.Code.Trim().ToUpperInvariant();

        // Check if matching coupon exists for this tenant in DB
        var coupon = await _dbContext.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Code == cleanCode && c.TenantId == _tenantContext.TenantId, cancellationToken);

        // Built-in standard tenant coupons for fast onboarding / demo (e.g. FIRST50, FLAT100, MILKE20)
        if (coupon == null)
        {
            if (cleanCode == "FIRST50")
            {
                var discount = Math.Min(request.OrderSubtotal * 0.50m, 100.00m);
                return new CouponValidationResult(
                    IsValid: true,
                    Code: cleanCode,
                    DiscountAmount: Math.Round(discount, 2),
                    FinalTotal: Math.Max(0, Math.Round(request.OrderSubtotal - discount, 2)),
                    Message: "50% OFF applied (Max savings ₹100)"
                );
            }
            if (cleanCode == "FLAT100")
            {
                if (request.OrderSubtotal < 399.00m)
                {
                    return new CouponValidationResult(
                        IsValid: false,
                        Code: cleanCode,
                        DiscountAmount: 0,
                        FinalTotal: request.OrderSubtotal,
                        Message: "FLAT100 requires a minimum order value of ₹399"
                    );
                }
                var discount = 100.00m;
                return new CouponValidationResult(
                    IsValid: true,
                    Code: cleanCode,
                    DiscountAmount: discount,
                    FinalTotal: Math.Max(0, request.OrderSubtotal - discount),
                    Message: "Flat ₹100 discount applied!"
                );
            }
            if (cleanCode == "MILKE20")
            {
                var discount = Math.Min(request.OrderSubtotal * 0.20m, 150.00m);
                return new CouponValidationResult(
                    IsValid: true,
                    Code: cleanCode,
                    DiscountAmount: Math.Round(discount, 2),
                    FinalTotal: Math.Max(0, Math.Round(request.OrderSubtotal - discount, 2)),
                    Message: "20% festive discount applied!"
                );
            }

            return new CouponValidationResult(
                IsValid: false,
                Code: cleanCode,
                DiscountAmount: 0,
                FinalTotal: request.OrderSubtotal,
                Message: "Invalid or expired promo code"
            );
        }

        if (!coupon.IsActive || (coupon.ValidUntil.HasValue && coupon.ValidUntil.Value < DateTimeOffset.UtcNow))
        {
            return new CouponValidationResult(
                IsValid: false,
                Code: cleanCode,
                DiscountAmount: 0,
                FinalTotal: request.OrderSubtotal,
                Message: "This coupon has expired"
            );
        }

        if (request.OrderSubtotal < coupon.MinOrderAmount)
        {
            return new CouponValidationResult(
                IsValid: false,
                Code: cleanCode,
                DiscountAmount: 0,
                FinalTotal: request.OrderSubtotal,
                Message: $"Minimum order amount for this coupon is ₹{coupon.MinOrderAmount}"
            );
        }

        if (coupon.UsageLimit.HasValue && coupon.TimesUsed >= coupon.UsageLimit.Value)
        {
            return new CouponValidationResult(
                IsValid: false,
                Code: cleanCode,
                DiscountAmount: 0,
                FinalTotal: request.OrderSubtotal,
                Message: "This coupon usage limit has been reached"
            );
        }

        decimal computedDiscount = 0;
        if (coupon.DiscountType == DiscountType.Percentage)
        {
            computedDiscount = request.OrderSubtotal * (coupon.DiscountValue / 100m);
            if (coupon.MaxDiscountAmount.HasValue && computedDiscount > coupon.MaxDiscountAmount.Value)
            {
                computedDiscount = coupon.MaxDiscountAmount.Value;
            }
        }
        else
        {
            computedDiscount = Math.Min(coupon.DiscountValue, request.OrderSubtotal);
        }

        computedDiscount = Math.Round(computedDiscount, 2);

        return new CouponValidationResult(
            IsValid: true,
            Code: cleanCode,
            DiscountAmount: computedDiscount,
            FinalTotal: Math.Max(0, Math.Round(request.OrderSubtotal - computedDiscount, 2)),
            Message: $"{coupon.Description ?? "Coupon applied successfully"}"
        );
    }
}
