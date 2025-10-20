package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.AnnotationDTO;
import com.university.transformer.oversight.dto.AnnotationExportDTO;
import com.university.transformer.oversight.exception.ResourceNotFoundException;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.service.AnnotationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AnnotationServiceImpl implements AnnotationService {

    private final AnnotationRepository annotationRepository;
    private final InspectionRepository inspectionRepository;

    private final ObjectMapper objectMapper;

    public AnnotationServiceImpl(AnnotationRepository annotationRepository, InspectionRepository inspectionRepository, ObjectMapper objectMapper) {
        this.annotationRepository = annotationRepository;
        this.inspectionRepository = inspectionRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public byte[] exportAllAnnotationsAsJson() throws IOException {

        // Fetch the data using the new joined repository query
        List<AnnotationExportDTO> dtos = annotationRepository.findAllAnnotationsForExport();

        // Use the injected ObjectMapper
        return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(dtos);
    }

    @Override
    @Transactional
    public void saveInitialAiAnnotations(Long inspectionId, String detectionJsonOutput) {
        if (detectionJsonOutput == null || detectionJsonOutput.trim().isEmpty()) {
            return;
        }


        List<Annotation> existingAnnotations = annotationRepository.findByInspectionId(inspectionId);
        if (!existingAnnotations.isEmpty()) {
            // Already have annotations. Do nothing.
            return;
        }

        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found with id: " + inspectionId));

        try {
            // Parse the JSON string into a Jackson array node
            JsonNode detections = objectMapper.readTree(detectionJsonOutput);
            if (!detections.isArray()) return;

            List<Annotation> newAnnotations = new ArrayList<>();

            for (JsonNode node : detections) {

                Annotation annotation = new Annotation();
                annotation.setInspection(inspection);

                // Map AI-specific fields
                annotation.setCurrentStatus(node.has("type") ? node.get("type").asText() : "FAULTY");
                annotation.setOriginalSource("AI");
                annotation.setAiConfidence(node.has("confidence") ? node.get("confidence").asDouble() : null);
                annotation.setAiSeverityScore(node.has("severity_score") ? node.get("severity_score").asInt() : null);
                annotation.setFaultType(node.has("type") ? node.get("type").asText() : "FAULTY");
                // Map Bounding Box Coordinates
                if (node.has("location")) {
                    JsonNode loc = node.get("location");
                    double xMin = loc.has("x_min") ? loc.get("x_min").asDouble() : 0;
                    double yMin = loc.has("y_min") ? loc.get("y_min").asDouble() : 0;
                    double xMax = loc.has("x_max") ? loc.get("x_max").asDouble() : 0;
                    double yMax = loc.has("y_max") ? loc.get("y_max").asDouble() : 0;

                    annotation.setX(xMin);
                    annotation.setY(yMin);
                    annotation.setWidth(xMax - xMin);
                    annotation.setHeight(yMax - yMin);
                }

                // Set default/required fields
                annotation.setComments(null);
                annotation.setUserId("AI");
                // timestamp is set automatically by @UpdateTimestamp
                annotation.setDeleted(false);

                newAnnotations.add(annotation);
            }

            annotationRepository.saveAll(newAnnotations);


        } catch (IOException e) {
            System.err.println("Error parsing AI detection JSON: " + e.getMessage());

        }
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
        List<Annotation> allAnnotations = annotationRepository.findByInspectionId(inspectionId);
        return allAnnotations.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveAnnotations(Long inspectionId, List<AnnotationDTO> finalAnnotations) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new ResourceNotFoundException("Inspection not found with id: " + inspectionId));

        //Get current non-deleted annotations from the database
        List<Annotation> currentAnnotations = annotationRepository.findByInspectionIdAndIsDeletedFalse(inspectionId);

        // Map existing active DB boxes by their ID
        Map<Long, Annotation> currentMap = currentAnnotations.stream()
                .collect(Collectors.toMap(Annotation::getId, a -> a));

        // Set of IDs present in the final list from the frontend
        Set<Long> incomingIds = finalAnnotations.stream()
                // Only care about existing boxes
                .filter(dto -> dto.getId() != null)
                .map(AnnotationDTO::getId)
                .collect(Collectors.toSet());

        // Process Deletions
        // Any box in the DB but NOT in the incoming list was deleted by the user.
        List<Annotation> deletedAnnotations = currentAnnotations.stream()
                .filter(existingAnn -> !incomingIds.contains(existingAnn.getId()))
                .map(existingAnn -> {
                    // Mark the deleted box with the final action status
                    existingAnn.setDeleted(true);
                    existingAnn.setCurrentStatus("USER_DELETED");

                    // Use the user/timestamp
                    existingAnn.setUserId(finalAnnotations.get(0).getUserId());
                    existingAnn.setTimestamp(finalAnnotations.get(0).getTimestamp());
                    return existingAnn;
                })
                .collect(Collectors.toList());

        // Save the soft deleted entities
        annotationRepository.saveAll(deletedAnnotations);
        annotationRepository.flush();

        // Process Additions and Edits
        List<Annotation> toSave = finalAnnotations.stream()
                .map(dto -> {
                    Annotation annotation;
                    String newStatus;

                    if (dto.getId() == null) {

                        annotation = new Annotation();

                        if (dto.getAiConfidence() != null || dto.getAiSeverityScore() != null) {
                            // This is an AI-detected box being saved for the first time
                            annotation.setOriginalSource("AI");

                            // Map the AI details for persistence
                            annotation.setAiConfidence(dto.getAiConfidence());
                            annotation.setAiSeverityScore(dto.getAiSeverityScore());
                            boolean isModified =
                                    (dto.getOriginalX() != null && Math.abs(dto.getX() - dto.getOriginalX()) > 0.001) ||
                                            (dto.getOriginalY() != null && Math.abs(dto.getY() - dto.getOriginalY()) > 0.001) ||
                                            (dto.getOriginalWidth() != null && Math.abs(dto.getWidth() - dto.getOriginalWidth()) > 0.001) ||
                                            (dto.getOriginalHeight() != null && Math.abs(dto.getHeight() - dto.getOriginalHeight()) > 0.001) ||
                                            (dto.getFaultType() != null && !dto.getFaultType().equals(annotation.getFaultType())) || // Check if faultType was changed on first save
                                            (dto.getComments() != null && !dto.getComments().isEmpty()); // Check if comments were added

                            // Check if the coordinates in the DTO match the original AI coordinates.
                            if (isModified) {
                                newStatus = "USER_EDITED";
                            } else {
                                // No edit detected, set status to the AI's original status

                                newStatus = dto.getCurrentStatus() != null ? dto.getCurrentStatus() : "FAULTY";
                            }
                        } else {
                            // This is a  new User Added box
                            annotation.setOriginalSource("USER");
                            newStatus = "USER_ADDED";

                            // Clear AI details for user added boxes
                            annotation.setAiConfidence(null);
                            annotation.setAiSeverityScore(null);
                        }
                    } else {

                        annotation = currentMap.get(dto.getId());

                        if (annotation == null) {
                            throw new ResourceNotFoundException("Cannot find active annotation with ID: " + dto.getId() + " for update. Data mismatch.");
                        }

                        boolean isEdited =
                                Math.abs(annotation.getX() - dto.getX()) > 0.001 ||
                                        Math.abs(annotation.getY() - dto.getY()) > 0.001 ||
                                        Math.abs(annotation.getWidth() - dto.getWidth()) > 0.001 ||
                                        Math.abs(annotation.getHeight() - dto.getHeight()) > 0.001 ||
                                        (annotation.getFaultType() != null ? !annotation.getFaultType().equals(dto.getFaultType()) : dto.getFaultType() != null) ||
                                        (annotation.getComments() != null ? !annotation.getComments().equals(dto.getComments()) : dto.getComments() != null);

                        if (isEdited) {
                            newStatus = "USER_EDITED";
                        } else {
                            // Keep the original status
                            newStatus = annotation.getCurrentStatus();
                        }
                    }

                    // Map DTO fields to Entity
                    annotation.setInspection(inspection);
                    annotation.setX(dto.getX());
                    annotation.setY(dto.getY());
                    annotation.setWidth(dto.getWidth());
                    annotation.setHeight(dto.getHeight());
                    annotation.setComments(dto.getComments());
                    annotation.setUserId(dto.getUserId());
                    annotation.setCurrentStatus(newStatus);
                    annotation.setDeleted(false); // Ensure new/edited boxes are not deleted
                    annotation.setFaultType(dto.getFaultType());
                    return annotation;
                })
                .collect(Collectors.toList());

        if (!toSave.isEmpty()) {
            annotationRepository.saveAll(toSave);
            annotationRepository.flush();
        }
    }
    // Helper method to convert Entity to DTO
    private AnnotationDTO convertToDTO(Annotation annotation) {
        AnnotationDTO dto = new AnnotationDTO();
        dto.setId(annotation.getId());
        dto.setCurrentStatus(annotation.getCurrentStatus());
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
        dto.setFaultType(annotation.getFaultType());
        return dto;
    }
}