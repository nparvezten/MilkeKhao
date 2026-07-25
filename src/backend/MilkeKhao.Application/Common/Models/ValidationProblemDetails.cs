namespace MilkeKhao.Application.Common.Models;

/// <summary>
/// Standard RFC7807 Problem Details representation for structured validation errors and domain failure responses.
/// </summary>
public record ValidationProblemDetails(
    string Type,
    string Title,
    int Status,
    string Detail,
    IDictionary<string, string[]> Errors
)
{
    public static ValidationProblemDetails Create(IDictionary<string, string[]> errors)
    {
        return new ValidationProblemDetails(
            Type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Title: "One or more validation errors occurred.",
            Status: 400,
            Detail: "Please refer to the errors property for additional details.",
            Errors: errors
        );
    }
}
