// src/main/java/com/university/transformer/oversight/service/impl/FeedbackExportServiceImpl.java

package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.AnnotationExportDTO;
import com.university.transformer.oversight.exception.ResourceNotFoundException;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.service.FeedbackExportService; // ⬅️ Import the new Interface
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service // ⬅️ The implementation class gets the @Service annotation
public class FeedbackExportServiceImpl implements FeedbackExportService { // ⬅️ Implements the interface

    private final InspectionRepository inspectionRepository;
    private final AnnotationRepository annotationRepository;

    public FeedbackExportServiceImpl(InspectionRepository inspectionRepository, AnnotationRepository annotationRepository) {
        this.inspectionRepository = inspectionRepository;
        this.annotationRepository = annotationRepository;
    }

    @Override
    public List<AnnotationExportDTO> getFeedbackLog(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found with id: " + inspectionId));

        // Assuming AnnotationRepository has this method (findByInspectionId)
        List<Annotation> allAnnotations = annotationRepository.findByInspectionId(inspectionId);

        String imageFileName = (inspection.getThermalImage() != null)
                ? inspection.getThermalImage().getFileName()
                : "N/A";

        return allAnnotations.stream()
                .map(annotation -> {
                    AnnotationExportDTO dto = new AnnotationExportDTO();

                    // Context Data
                    dto.setInspectionId(inspection.getId());
                    dto.setInspectionNo(inspection.getInspectionNo());
                    dto.setImageFileName(imageFileName);

                    // Final Annotation State
                    dto.setAnnotationId(annotation.getId());
                    dto.setFinalStatus(annotation.getCurrentStatus());
                    dto.setX(annotation.getX());
                    dto.setY(annotation.getY());
                    dto.setWidth(annotation.getWidth());
                    dto.setHeight(annotation.getHeight());
                    dto.setComments(annotation.getComments());

                    // Annotator Metadata
                    dto.setAnnotatorId(annotation.getUserId());
                    dto.setLastUpdated(annotation.getTimestamp());

                    // Original AI Data
                    dto.setOriginalSource(annotation.getOriginalSource());
                    dto.setAiConfidence(annotation.getAiConfidence());
                    dto.setAiSeverityScore(annotation.getAiSeverityScore());

                    return dto;
                })
                .collect(Collectors.toList());
    }
}