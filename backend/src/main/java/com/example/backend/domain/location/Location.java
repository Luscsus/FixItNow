package com.example.backend.domain.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "locations")
@Getter
@Setter
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "street_name", length = 255)
    private String streetName;

    @Column(name = "street_number", length = 20)
    private String streetNumber;

    @Column(length = 100)
    private String city;

    @Column(name = "postal_code", length = 20)
    private String postalCode;

    @Column(length = 100)
    private String country;

    private Double latitude;

    private Double longitude;

    public Location() {
    }

    public Location(Long id, String streetName, String streetNumber, String city,
                    String postalCode, String country, Double latitude, Double longitude) {
        this.id = id;
        this.streetName = streetName;
        this.streetNumber = streetNumber;
        this.city = city;
        this.postalCode = postalCode;
        this.country = country;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getFormattedAddress() {
        StringBuilder sb = new StringBuilder();
        if (streetName != null) sb.append(streetName);
        if (streetNumber != null && !streetNumber.isBlank()) sb.append(" ").append(streetNumber);
        if (city != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(city);
        }
        if (postalCode != null && !postalCode.isBlank()) sb.append(" ").append(postalCode);
        if (country != null) {
            if (sb.length() > 0) sb.append(", ");
            sb.append(country);
        }
        return sb.toString().trim();
    }
}
