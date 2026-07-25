namespace MilkeKhao.Domain.ValueObjects;

public class Address
{
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public string? Landmark { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    public static Address Empty => new Address(string.Empty, string.Empty, string.Empty, string.Empty);

    public Address() { }

    public Address(string street, string city, string state, string postalCode, string? landmark = null, double? latitude = null, double? longitude = null)
    {
        Street = street;
        City = city;
        State = state;
        PostalCode = postalCode;
        Landmark = landmark;
        Latitude = latitude;
        Longitude = longitude;
    }
}
