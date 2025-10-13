package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "anomaly_detection_result")
public class AnomalyDetectionResult {

    // Existing Getters and Setters...
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- START CRITICAL ADDITION FOR SCALING ---

    // --- NEW GETTERS AND SETTERS ---
    @Column(name = "original_width")
    private Integer originalWidth; // Stores W_original from Python output

    @Column(name = "original_height")
    private Integer originalHeight; // Stores H_original from Python output

    // --- END CRITICAL ADDITION FOR SCALING ---

    @Column(name = "overall_status")
    private String overallStatus; // FAULTY, POTENTIALLY_FAULTY, NORMAL, UNCERTAIN

    @Column(name = "detection_json_output", columnDefinition = "TEXT")
    private String detectionJsonOutput; // JSON string of the list of anomalies/bounding boxes

    @Column(name = "detected_timestamp")
    private LocalDateTime detectedTimestamp;

    @Column(name = "output_image_name")
    private String outputImageName; // Name/Relative Path of the annotated image

    @OneToOne
    @JoinColumn(name = "inspection_id", referencedColumnName = "id", unique = true)
    private Inspection inspection;

    // --- Constructors, Getters, and Setters ---
    public AnomalyDetectionResult() {}

}