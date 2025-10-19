// src/main/java/com/university/transformer/oversight/dto/AnnotationExportDTO.java
package com.university.transformer.oversight.dto;
import lombok.NoArgsConstructor; // Good practice to include
import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

// Note: Use Lombok @Data for getters/setters/constructors if available, 
// otherwise, add them manually.
@Data
@NoArgsConstructor // Ensure a default constructor exists for general use

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

    public AnnotationExportDTO(
            Long inspectionId, String inspectionNo, String imageFileName,
            Long annotationId, String finalStatus, String comments,
            double x, double y, double width, double height,
            String annotatorId, LocalDateTime lastUpdated,
            String originalSource, Double aiConfidence, Integer aiSeverityScore) {

        this.inspectionId = inspectionId;
        this.inspectionNo = inspectionNo;
        this.imageFileName = imageFileName;
        this.annotationId = annotationId;
        this.finalStatus = finalStatus;
        this.comments = comments;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.annotatorId = annotatorId;
        this.lastUpdated = lastUpdated;
        this.originalSource = originalSource;
        this.aiConfidence = aiConfidence;
        this.aiSeverityScore = aiSeverityScore;
    }

}