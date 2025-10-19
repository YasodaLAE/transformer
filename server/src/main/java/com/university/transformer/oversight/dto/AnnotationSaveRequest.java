// Update AnnotationSaveRequest.java
package com.university.transformer.oversight.dto;

import lombok.Data;
import java.util.List;

@Data
public class AnnotationSaveRequest {
    // Only keep the final annotations that should be in the DB
    private List<AnnotationDTO> finalAnnotations;
}