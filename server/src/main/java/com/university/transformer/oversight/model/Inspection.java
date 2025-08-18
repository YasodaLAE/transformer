package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // A field to store the unique inspection number
    private String inspectionNo;

    // Fields for the dates
    private LocalDate inspectedDate;
    private LocalDate maintenanceDate;

    // A field for the inspection status (e.g., "In Progress", "Completed", "Pending")
    private String status;

    // The many-to-one relationship with Transformer
    @Getter
    @Setter
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transformer_id")
    private Transformer transformer;

    // Constructors, getters, and setters
}