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
    private String transformerId;
    private String poleId;
    private String region;
    private Double type;

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ThermalImage> thermalImages;
}