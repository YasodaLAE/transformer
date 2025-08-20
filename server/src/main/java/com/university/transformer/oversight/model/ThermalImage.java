package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class ThermalImage {

    public enum ImageType {
        BASELINE,
        MAINTENANCE
    }

// Replace your entire enum block with this

    public enum EnvironmentalCondition {
        SUNNY,
        CLOUDY,
        RAINY; // <-- Make sure there's a semicolon here

        @JsonCreator
        public static EnvironmentalCondition fromString(String value) {
            if (value == null) {
                return null;
            }
            return EnvironmentalCondition.valueOf(value.toUpperCase());
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private String filePath;

    @Enumerated(EnumType.STRING)
    private ImageType imageType;

    @Enumerated(EnumType.STRING)
    private EnvironmentalCondition environmentalCondition;

    private LocalDateTime uploadTimestamp;
    private String uploaderId; // Or a reference to a User entity in a future phase

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id", nullable = false)
    @JsonBackReference
    private Transformer transformer;
}
