package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Set;

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

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch=FetchType.EAGER, orphanRemoval = true)
    @JsonManagedReference
    private List<Inspection> inspections;

    @OneToMany(mappedBy = "transformer", cascade = CascadeType.ALL, fetch=FetchType.LAZY)
    @JsonManagedReference
    private List<ThermalImage> thermalImages;


}