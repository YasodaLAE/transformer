// Create/Update AnnotationDTO.java
package com.university.transformer.oversight.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AnnotationDTO {
    private Long id; // null for new annotations, DB ID for existing ones
    private String currentStatus; // ⬅️ RENAMED: Now maps to the status field
    private String originalSource;
//    private String type; // Initial type (AI_DETECTED, USER_ADDED, etc.)
    private Double aiConfidence;
    private Integer aiSeverityScore;
    private double x;
    private double y;
    private double width;
    private double height;
    private String comments;
    private String faultType;
    // New Fields for persistence and tracking
    private String userId; // User who last modified/created
    private LocalDateTime timestamp; // Last modification time

    // Transient fields for the frontend/save logic
    private String boxSessionId; // The temporary ID (e.g., 'ai-0' or 'user_new-1')
    private String actionType; // 'ADDED', 'EDITED', 'DELETED' (Used during save process)
    private AnnotationDTO originalState; // Used to track the state before an edit/delete (optional)
    private Double originalX;
    private Double originalY;
    private Double originalWidth;
    private Double originalHeight;
}