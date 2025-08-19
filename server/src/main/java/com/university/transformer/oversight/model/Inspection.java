package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonBackReference;

import java.time.LocalDate;

@Entity
@Table(name = "inspection")
@Data
@NoArgsConstructor
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
    @JsonBackReference
    private Transformer transformer;

    // Constructors, getters, and setters
}