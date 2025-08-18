package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.List;

@Entity
@Data // Lombok annotation to generate getters, setters, toString, etc.
public class Transformer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Primary key for the database

    @Column(unique = true, nullable = false)
    private String transformerId; // Business ID like 'AZ-8890'

    private String location;
    private Double capacity; // e.g., in kVA

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ThermalImage> thermalImages;
}