// AnnotationService.java (Interface)
package com.university.transformer.oversight.service;

import com.university.transformer.oversight.dto.AnnotationDTO;
import com.university.transformer.oversight.dto.AnnotationSaveRequest; // Import the DTO
import java.io.IOException;
import java.util.List;

public interface AnnotationService {
    List<AnnotationDTO> getAnnotationsByInspectionId(Long inspectionId);
    List<AnnotationDTO> getAllAnnotationsForDisplay(Long inspectionId);
    void saveInitialAiAnnotations(Long inspectionId, String detectionJsonOutput);
    void saveAnnotations(Long inspectionId, List<AnnotationDTO> finalAnnotations);
    byte[] exportAllAnnotationsAsJson() throws IOException;
}