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

    public enum EnvironmentalCondition {
        SUNNY,
        CLOUDY,
        RAINY;

        @JsonCreator
        public static EnvironmentalCondition fromString(String value) {
            if (value == null) { return null; }
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
    private String uploaderId;

    // --- RELATIONSHIP CHANGED ---
    @OneToOne
    @JoinColumn(name = "inspection_id", unique = true)
    @JsonBackReference
    private Inspection inspection;
}