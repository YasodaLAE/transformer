// src/main/java/com/university/transformer/oversight/dto/AnnotationExportDTO.java
package com.university.transformer.oversight.dto;

import lombok.Data;

import java.time.LocalDateTime;

// Note: Use Lombok @Data for getters/setters/constructors if available, 
// otherwise, add them manually.
@Data
public class AnnotationExportDTO {

    // Inspection/Context Data
    private Long inspectionId;
    private String inspectionNo;
    private String imageFileName;

    // Final User Annotation State
    private Long annotationId;
    private String finalStatus; // e.g., USER_EDITED, USER_DELETED, FAULTY
    private String comments;

    // Final Bounding Box (Coordinates)
    private double x;
    private double y;
    private double width;
    private double height;

    // Annotator Metadata
    private String annotatorId;
    private LocalDateTime lastUpdated;

    // Original AI Data (Copied from Anomaly.java)
    private String originalSource; // AI or USER
    private Double aiConfidence;
    private Integer aiSeverityScore;

    // Original AI Box (The raw coordinates from the detectionJsonOutput before modification)
    // NOTE: We cannot easily link the final annotation to its original coordinates 
    // unless you stored the original AI coordinates in the Annotation entity.
    // For simplicity, we omit the original AI coords, as final coords are sufficient feedback.

    // Add Getters and Setters here (Omitted for brevity, assume Lombok @Data is used)
}