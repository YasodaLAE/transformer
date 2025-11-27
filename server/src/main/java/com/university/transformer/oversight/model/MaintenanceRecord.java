package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "maintenance_record")
@Data
@NoArgsConstructor
public class MaintenanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "inspection_id", unique = true, nullable = false)
    @JsonBackReference
    private Inspection inspection;

    // --- Engineer Information (NEW) ---
    private String inspectorName;
    private LocalDate inspectionEngineerDate;
    private LocalTime inspectionEngineerTime;

    // --- Electrical Readings ---
    private String voltageL1;
    private String voltageL2;
    private String voltageL3;

    private String currentL1;
    private String currentL2;
    private String currentL3;

    private String oilLevel;
    private String oilTemperature;

    // --- Status & Remarks ---
    private String transformerStatus;
    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String correctiveAction; // (NEW)

    @Column(columnDefinition = "TEXT")
    private String comments;
}