package com.university.transformer.oversight.service;

import com.university.transformer.oversight.dto.AnnotationDTO;
import java.util.List;

public interface AnnotationService {
    List<AnnotationDTO> getAnnotationsByInspectionId(Long inspectionId);
    void saveAnnotations(Long inspectionId, List<AnnotationDTO> finalAnnotations, List<AnnotationDTO> loggableChanges);
}