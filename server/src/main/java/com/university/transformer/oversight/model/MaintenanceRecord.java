package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
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

    // --- Job Timing ---
    private LocalTime jobStartedTime;
    private LocalTime jobCompletedTime;

    // --- Electrical Readings (FR4.2) ---
    // Storing as String to allow flexibility (e.g. "230V")
    private String voltageL1;
    private String voltageL2;
    private String voltageL3;

    private String currentL1;
    private String currentL2;
    private String currentL3;

    private String oilLevel; // Standard check
    private String oilTemperature; // Standard check

    // --- Status & Remarks (FR4.2) ---
    private String transformerStatus; // OK, Needs Maintenance, Urgent
    private String recommendedAction;

    @Column(columnDefinition = "TEXT")
    private String comments; // General remarks
}