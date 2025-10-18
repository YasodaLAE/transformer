package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.AnnotationDTO;
import com.university.transformer.oversight.exception.ResourceNotFoundException;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.AnnotationLog;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.repository.AnnotationLogRepository;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.service.AnnotationService;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnnotationServiceImpl implements AnnotationService {

    private final AnnotationRepository annotationRepository;
    private final InspectionRepository inspectionRepository;
    private final AnnotationLogRepository annotationLogRepository; // Inject new repo
    private final ObjectMapper objectMapper; // Inject ObjectMapper

    public AnnotationServiceImpl(AnnotationRepository annotationRepository, InspectionRepository inspectionRepository, AnnotationLogRepository annotationLogRepository) {
        this.annotationRepository = annotationRepository;
        this.inspectionRepository = inspectionRepository;
        this.annotationLogRepository = annotationLogRepository;
        this.objectMapper = new ObjectMapper(); // Initialize ObjectMapper
        this.objectMapper.findAndRegisterModules(); // Ensure compatibility with LocalDateTime
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
    public void saveAnnotations(Long inspectionId, List<AnnotationDTO> finalAnnotations, List<AnnotationDTO> loggableChanges) {
// 1. Log the changes (Must be done first, as it needs 'originalState')
        Inspection inspection;
        inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));
        List<AnnotationLog> logs = loggableChanges.stream().map(dto -> {
            AnnotationLog log = new AnnotationLog();
            log.setInspection(inspection);
            log.setBoxSessionId(dto.getBoxSessionId());
            log.setUserId(dto.getUserId());
            log.setActionType(dto.getActionType());
            log.setComments(dto.getComments());
            log.setTimestamp(LocalDateTime.now());
            log.setUserModified(true); // All saved logs are user modifications

            try {
                // Modified state is the DTO itself, since it represents the final state of the box (or null if deleted)
                if ("DELETED".equals(dto.getActionType())) {
                    // For a DELETED action, the DTO contains the original state, and modified state is null
                    log.setOriginalStateJson(objectMapper.writeValueAsString(dto));
                    log.setModifiedStateJson(null);
                } else {
                    // For ADDED/EDITED, originalState is the state before the change
                    log.setOriginalStateJson(dto.getOriginalState() != null ? objectMapper.writeValueAsString(dto.getOriginalState()) : null);
                    log.setModifiedStateJson(objectMapper.writeValueAsString(dto));
                }
            } catch (Exception e) {
                throw new RuntimeException("Error converting annotation to JSON for logging", e);
            }
            return log;
        }).collect(Collectors.toList());

        if (!logs.isEmpty()) {
            annotationLogRepository.saveAll(logs);
        }

        // 2. Delete all old final annotations
        annotationRepository.deleteByInspectionId(inspectionId);

        // 3. Convert and save the new list of final annotations
        List<Annotation> newAnnotations = finalAnnotations.stream()
                .map(dto -> {
                    Annotation annotation = new Annotation();
                    annotation.setInspection(inspection);
                    annotation.setType(dto.getType());
                    annotation.setX(dto.getX());
                    annotation.setY(dto.getY());
                    annotation.setWidth(dto.getWidth());
                    annotation.setHeight(dto.getHeight());
                    annotation.setComments(dto.getComments());
                    // Use a more appropriate 'final' type for persistence, e.g., 'USER_VALIDATED'
                    annotation.setType("USER_VALIDATED");
                    annotation.setUserId(dto.getUserId());
                    annotation.setTimestamp(LocalDateTime.now());
                    return annotation;
                })
                .collect(Collectors.toList());

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