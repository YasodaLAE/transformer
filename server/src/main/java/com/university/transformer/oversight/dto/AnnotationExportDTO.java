package com.university.transformer.oversight.dto;
import lombok.*;

import java.time.LocalDateTime;


@Getter
@Setter
@Data
@NoArgsConstructor

public class AnnotationExportDTO {

    // Inspection/Context Data
    private Long inspectionId;
    private String inspectionNo;
    private String imageFileName;

    // Final User Annotation State
    private Long annotationId;
    private String finalStatus;
    private String faultType;
    private String comments;

    // Final Bounding Box (Coordinates)
    private double x;
    private double y;
    private double width;
    private double height;

    // Annotator Metadata
    private String annotatorId;
    private LocalDateTime lastUpdated;

    // Original AI Data
    private String originalSource; // AI or USER
    private Double aiConfidence;
    private Integer aiSeverityScore;

    public AnnotationExportDTO(
            Long inspectionId, String inspectionNo, String imageFileName,
            Long annotationId, String finalStatus, String faultType, String comments,
            double x, double y, double width, double height,
            String annotatorId, LocalDateTime lastUpdated,
            String originalSource, Double aiConfidence, Integer aiSeverityScore) {

        this.inspectionId = inspectionId;
        this.inspectionNo = inspectionNo;
        this.imageFileName = imageFileName;
        this.annotationId = annotationId;
        this.faultType = faultType;
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