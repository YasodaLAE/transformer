package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data
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

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ThermalImage> thermalImages;
}