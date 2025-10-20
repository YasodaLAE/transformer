package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_detection_result")
public class AnomalyDetectionResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "overall_status")
    private String overallStatus; // FAULTY, POTENTIALLY_FAULTY,

    @Column(name = "detection_json_output", columnDefinition = "TEXT")
    private String detectionJsonOutput; // JSON string of the list of anomalies

    @Column(name = "detected_timestamp")
    private LocalDateTime detectedTimestamp;

    @Column(name = "output_image_name")
    private String outputImageName; // Name/Relative Path of the annotated image

    @OneToOne
    @JoinColumn(name = "inspection_id", referencedColumnName = "id", unique = true)
    private Inspection inspection;

    // --- Constructors, Getters, and Setters ---
    public AnomalyDetectionResult() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOverallStatus() { return overallStatus; }
    public void setOverallStatus(String overallStatus) { this.overallStatus = overallStatus; }
    public String getDetectionJsonOutput() { return detectionJsonOutput; }
    public void setDetectionJsonOutput(String detectionJsonOutput) { this.detectionJsonOutput = detectionJsonOutput; }
    public LocalDateTime getDetectedTimestamp() { return detectedTimestamp; }
    public void setDetectedTimestamp(LocalDateTime detectedTimestamp) { this.detectedTimestamp = detectedTimestamp; }
    public String getOutputImageName() { return outputImageName; }
    public void setOutputImageName(String outputImageName) { this.outputImageName = outputImageName; }
    public Inspection getInspection() { return inspection; }
    public void setInspection(Inspection inspection) { this.inspection = inspection; }
}