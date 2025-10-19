// AnnotationServiceImpl.java (Implementation)

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
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AnnotationServiceImpl implements AnnotationService {

    private final AnnotationRepository annotationRepository;
    private final InspectionRepository inspectionRepository;
    // REMOVED: private final AnnotationLogRepository annotationLogRepository;
    // REMOVED: private final ObjectMapper objectMapper;

    public AnnotationServiceImpl(AnnotationRepository annotationRepository, InspectionRepository inspectionRepository) {
        this.annotationRepository = annotationRepository;
        this.inspectionRepository = inspectionRepository;
    }

    @Override
    public List<AnnotationDTO> getAnnotationsByInspectionId(Long inspectionId) {
        if (!inspectionRepository.existsById(inspectionId)) {
            throw new ResourceNotFoundException("Inspection not found with id: " + inspectionId);
        }
        // ⚠️ CRITICAL: Must use the filter to avoid loading previously deleted boxes
        List<Annotation> annotations = annotationRepository.findByInspectionIdAndIsDeletedFalse(inspectionId);
        return annotations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }


    // AnnotationServiceImpl.java

    @Override
    @Transactional
    public void saveAnnotations(Long inspectionId, List<AnnotationDTO> finalAnnotations) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found with id: " + inspectionId));

        // 1. Get current non-deleted annotations from the database
        List<Annotation> currentAnnotations = annotationRepository.findByInspectionIdAndIsDeletedFalse(inspectionId);

        // Map existing active DB boxes by their ID (Long)
        Map<Long, Annotation> currentMap = currentAnnotations.stream()
                .collect(Collectors.toMap(Annotation::getId, a -> a));

        // Set of IDs present in the final list from the frontend
        Set<Long> incomingIds = finalAnnotations.stream()
                // Only care about existing boxes (non-null IDs)
                .filter(dto -> dto.getId() != null)
                .map(AnnotationDTO::getId)
                .collect(Collectors.toSet());

        // 2. Process Deletions (Soft Delete)
        // Any box in the DB but NOT in the incoming list was deleted by the user.
        List<Annotation> deletedAnnotations = currentAnnotations.stream()
                .filter(existingAnn -> !incomingIds.contains(existingAnn.getId()))
                .map(existingAnn -> {
                    // Mark the deleted box with the final action status
                    existingAnn.setDeleted(true);
                    existingAnn.setType("USER_DELETED");
                    // Use the user/timestamp from the first incoming DTO for audit trail of the save operation
                    existingAnn.setUserId(finalAnnotations.get(0).getUserId());
                    existingAnn.setTimestamp(finalAnnotations.get(0).getTimestamp());
                    return existingAnn;
                })
                .collect(Collectors.toList());

        // Save the soft-deleted entities
        annotationRepository.saveAll(deletedAnnotations);


        // 3. Process Additions (id == null) and Edits (id != null)
        List<Annotation> toSave = finalAnnotations.stream()
                .map(dto -> {
                    Annotation annotation;
                    String finalType;

                    if (dto.getId() == null) {
                        // 🎯 CASE A: New Box (INSERT)
                        annotation = new Annotation();
                        finalType = "USER_ADDED";
                    } else {
                        // 🎯 CASE B: Existing Box (UPDATE/EDIT)
                        annotation = currentMap.get(dto.getId());

                        if (annotation == null) {
                            // This handles the error you had before. An existing ID was sent,
                            // but it wasn't found in the active DB set. Throw an exception,
                            // as this is a stale or corrupted ID from the client.
                            throw new ResourceNotFoundException("Cannot find active annotation with ID: " + dto.getId() + " for update. Data mismatch.");
                        }

                        boolean isEdited =
                                Math.abs(annotation.getX() - dto.getX()) > 0.001 ||
                                        Math.abs(annotation.getY() - dto.getY()) > 0.001 ||
                                        Math.abs(annotation.getWidth() - dto.getWidth()) > 0.001 ||
                                        Math.abs(annotation.getHeight() - dto.getHeight()) > 0.001 ||
                                        (annotation.getComments() != null ? !annotation.getComments().equals(dto.getComments()) : dto.getComments() != null);

                        finalType = isEdited ? "USER_EDITED" : "USER_VALIDATED";
                    }

                    // Map DTO fields to Entity
                    annotation.setInspection(inspection); // Safe now, as annotation is either new or retrieved
                    annotation.setX(dto.getX());
                    annotation.setY(dto.getY());
                    annotation.setWidth(dto.getWidth());
                    annotation.setHeight(dto.getHeight());
                    annotation.setComments(dto.getComments());
                    annotation.setUserId(dto.getUserId());
                    annotation.setTimestamp(dto.getTimestamp());
                    annotation.setType(finalType);
                    annotation.setDeleted(false); // Ensure new/edited boxes are not deleted

                    return annotation;
                })
                .collect(Collectors.toList());

        if (!toSave.isEmpty()) {
            // JPA handles the magic:
            // - Entities with null ID are inserted (new boxes).
            // - Entities with non-null ID are updated (edited boxes).
            annotationRepository.saveAll(toSave);
        }
    }
    // Helper method to convert Entity to DTO (No change needed)
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
        // Note: boxSessionId, actionType, originalState are transient, so not read from DB
        return dto;
    }
}