package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.AnnotationDTO;
import com.university.transformer.oversight.exception.ResourceNotFoundException;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.service.AnnotationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnotationServiceImpl implements AnnotationService {

    private final AnnotationRepository annotationRepository;
    private final InspectionRepository inspectionRepository;

    public AnnotationServiceImpl(AnnotationRepository annotationRepository, InspectionRepository inspectionRepository) {
        this.annotationRepository = annotationRepository;
        this.inspectionRepository = inspectionRepository;
    }

    @Override
    public List<AnnotationDTO> getAnnotationsByInspectionId(Long inspectionId) {
        if (!inspectionRepository.existsById(inspectionId)) {
            throw new ResourceNotFoundException("Inspection not found with id: " + inspectionId);
        }
        List<Annotation> annotations = annotationRepository.findByInspectionId(inspectionId);
        return annotations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // --- REPLACE THE ENTIRE saveAnnotations METHOD WITH THIS ---
    @Override
    @Transactional
    public void saveAnnotations(Long inspectionId, List<AnnotationDTO> annotationDTOs) {
        // 1. Find the parent inspection to ensure it exists.
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));

        // 2. Directly delete all old annotations for this inspection.
        annotationRepository.deleteByInspectionId(inspectionId);

        // 3. Convert the new DTOs into a list of Annotation entities.
        List<Annotation> newAnnotations = annotationDTOs.stream()
                .map(dto -> {
                    Annotation annotation = new Annotation();
                    annotation.setInspection(inspection);

                    // --- THIS IS THE CORRECTED LINE ---
                    annotation.setType(dto.getType());

                    annotation.setX(dto.getX());
                    annotation.setY(dto.getY());
                    annotation.setWidth(dto.getWidth());
                    annotation.setHeight(dto.getHeight());
                    annotation.setComments(dto.getComments());
                    annotation.setUserId(dto.getUserId());
                    annotation.setTimestamp(LocalDateTime.now());
                    return annotation;
                })
                .collect(Collectors.toList());

        // 4. Save the new list of annotations directly.
        if (!newAnnotations.isEmpty()) {
            annotationRepository.saveAll(newAnnotations);
        }
    }
    // Helper method to convert Entity to DTO
    private AnnotationDTO convertToDTO(Annotation annotation) {
        AnnotationDTO dto = new AnnotationDTO();
        dto.setId(annotation.getId());
        dto.setType(annotation.getType());
        dto.setX(annotation.getX());
        dto.setY(annotation.getY());
        dto.setWidth(annotation.getWidth());
        dto.setHeight(annotation.getHeight());
        dto.setComments(annotation.getComments());
        dto.setUserId(annotation.getUserId());
        dto.setTimestamp(annotation.getTimestamp());
        return dto;
    }

    // Helper method to convert DTO to Entity
    private Annotation convertToEntity(AnnotationDTO dto, Inspection inspection) {
        Annotation annotation = new Annotation();
        annotation.setInspection(inspection);
        annotation.setType(dto.getType());
        annotation.setX(dto.getX());
        annotation.setY(dto.getY());
        annotation.setWidth(dto.getWidth());
        annotation.setHeight(dto.getHeight());
        annotation.setComments(dto.getComments());
        annotation.setUserId("temp-user"); // Replace with actual authenticated user
        annotation.setTimestamp(LocalDateTime.now());
        return annotation;
    }
}