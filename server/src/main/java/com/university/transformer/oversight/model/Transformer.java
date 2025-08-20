package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
public class Transformer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Primary key for the database

    @Column(unique = true, nullable = false)
    private String transformerId;
    private String poleId;
    private String region;
    private String transformerType;
    private String details;
    private String baselineImageName;
    private String baselineImageCondition;
    private String baselineImageUploader; // New field for the uploader
    private LocalDateTime baselineImageUploadTimestamp; // New field for the timestamp

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch=FetchType.EAGER, orphanRemoval = true)
    @JsonManagedReference
    private List<Inspection> inspections;

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch=FetchType.LAZY)
    @JsonManagedReference
    private List<ThermalImage> thermalImages;

    public List<ThermalImage> getThermalImages() {
        return thermalImages;
    }


}