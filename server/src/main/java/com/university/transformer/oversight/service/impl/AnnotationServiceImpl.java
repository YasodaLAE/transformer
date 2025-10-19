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
        List<Annotation> annotations = annotationRepository.findByInspectionIdAndIsDeletedFalse(inspectionId);
        return annotations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }


    @Override
    public List<AnnotationDTO> getAllAnnotationsForDisplay(Long inspectionId) {
        if (!inspectionRepository.existsById(inspectionId)) {
            throw new ResourceNotFoundException("Inspection not found with id: " + inspectionId);
        }
        // Assuming your repository has a method to find ALL annotations by inspectionId
        List<Annotation> allAnnotations = annotationRepository.findByInspectionId(inspectionId);
        return allAnnotations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

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
                    existingAnn.setCurrentStatus("USER_DELETED");

                    // Use the user/timestamp from the first incoming DTO for audit trail of the save operation
                    existingAnn.setUserId(finalAnnotations.get(0).getUserId());
                    existingAnn.setTimestamp(finalAnnotations.get(0).getTimestamp());
                    return existingAnn;
                })
                .collect(Collectors.toList());

        // Save the soft-deleted entities
        annotationRepository.saveAll(deletedAnnotations);
        annotationRepository.flush();

        // 3. Process Additions (id == null) and Edits (id != null)
        List<Annotation> toSave = finalAnnotations.stream()
                .map(dto -> {
                    Annotation annotation;
                    String newStatus;

                    if (dto.getId() == null) {

                        annotation = new Annotation();

                        // 💥 MODIFIED LOGIC: Check for AI metrics in the DTO
                        if (dto.getAiConfidence() != null || dto.getAiSeverityScore() != null) {
                            // This is an AI-detected box being saved for the first time
                            annotation.setOriginalSource("AI");
                            //newStatus = dto.getCurrentStatus() != null ? dto.getCurrentStatus() : "FAULTY";
                            // Map the AI details for persistence
                            annotation.setAiConfidence(dto.getAiConfidence());
                            annotation.setAiSeverityScore(dto.getAiSeverityScore());
                            boolean isModified =
                                    (dto.getOriginalX() != null && Math.abs(dto.getX() - dto.getOriginalX()) > 0.001) ||
                                            (dto.getOriginalY() != null && Math.abs(dto.getY() - dto.getOriginalY()) > 0.001) ||
                                            (dto.getOriginalWidth() != null && Math.abs(dto.getWidth() - dto.getOriginalWidth()) > 0.001) ||
                                            (dto.getOriginalHeight() != null && Math.abs(dto.getHeight() - dto.getOriginalHeight()) > 0.001) ||
                                            (dto.getComments() != null && !dto.getComments().isEmpty()); // Check if comments were added

                            // Check if the coordinates in the DTO match the original AI coordinates.
                            if (isModified) {
                                newStatus = "USER_EDITED";
                            } else {
                                // No edit detected, set status to the AI's original status (or a validated status)
                                // We use FAULTY to denote it passed through and was not modified.
                                newStatus = dto.getCurrentStatus() != null ? dto.getCurrentStatus() : "FAULTY";
                            }
                        } else {
                            // This is a genuinely new User-Added box
                            annotation.setOriginalSource("USER");
                            newStatus = "USER_ADDED";

                            // Clear AI details for user-added boxes
                            annotation.setAiConfidence(null);
                            annotation.setAiSeverityScore(null);
                        }
                    } else {

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

                        if (isEdited) {
                            newStatus = "USER_EDITED";
                        } else {
                            // Keep the original status (e.g., FAULTY, USER_ADDED, USER_EDITED from previous save)
                            newStatus = annotation.getCurrentStatus();
                        }
                    }

                    // Map DTO fields to Entity
                    annotation.setInspection(inspection); // Safe now, as annotation is either new or retrieved
                    annotation.setX(dto.getX());
                    annotation.setY(dto.getY());
                    annotation.setWidth(dto.getWidth());
                    annotation.setHeight(dto.getHeight());
                    annotation.setComments(dto.getComments());
                    annotation.setUserId(dto.getUserId());
//                    annotation.setTimestamp(dto.getTimestamp());
                    annotation.setCurrentStatus(newStatus);
                    annotation.setDeleted(false); // Ensure new/edited boxes are not deleted

                    return annotation;
                })
                .collect(Collectors.toList());

        if (!toSave.isEmpty()) {
            // JPA handles the magic:
            // - Entities with null ID are inserted (new boxes).
            // - Entities with non-null ID are updated (edited boxes).
            annotationRepository.saveAll(toSave);
            annotationRepository.flush();
        }
    }
    // Helper method to convert Entity to DTO (No change needed)
    private AnnotationDTO convertToDTO(Annotation annotation) {
        AnnotationDTO dto = new AnnotationDTO();
        dto.setId(annotation.getId());
        dto.setCurrentStatus(annotation.getCurrentStatus()); // ⬅️ Use new field name
        dto.setOriginalSource(annotation.getOriginalSource());
        dto.setX(annotation.getX());
        dto.setY(annotation.getY());
        dto.setWidth(annotation.getWidth());
        dto.setHeight(annotation.getHeight());
        dto.setComments(annotation.getComments());
        dto.setUserId(annotation.getUserId());
        dto.setTimestamp(annotation.getTimestamp());
        dto.setAiConfidence(annotation.getAiConfidence());
        dto.setAiSeverityScore(annotation.getAiSeverityScore());
        // Note: boxSessionId, actionType, originalState are transient, so not read from DB
        return dto;
    }
}