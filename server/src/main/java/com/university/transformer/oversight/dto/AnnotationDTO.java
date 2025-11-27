// Create/Update AnnotationDTO.java
package com.university.transformer.oversight.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnnotationDTO {
    private Long id;
    private String currentStatus;
    private String originalSource;
    private Double aiConfidence;
    private Integer aiSeverityScore;
    private double x;
    private double y;
    private double width;
    private double height;
    private String comments;
    private String faultType;
    private String userId; // User who last modified/created
    private LocalDateTime timestamp; // Last modification time

    // Transient fields for the frontend/save logic
    private String boxSessionId; // The temporary ID
    private String actionType; // 'ADDED', 'EDITED', 'DELETED'
    private AnnotationDTO originalState;
    private Double originalX;
    private Double originalY;
    private Double originalWidth;
    private Double originalHeight;
}