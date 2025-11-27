package com.university.transformer.oversight.dto;

import lombok.Data;
import java.util.List;

@Data
public class AnnotationSaveRequest {
    private List<AnnotationDTO> finalAnnotations;
}