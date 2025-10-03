package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class InspectionServiceImpl implements InspectionService {

    @Autowired
    private InspectionRepository inspectionRepository;
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    @Autowired
    private FileStorageService fileStorageService;

    // INJECT THE ANOMALY RESULT REPOSITORY
    @Autowired
    private AnomalyDetectionResultRepository anomalyDetectionResultRepository;

    private static final Logger logger = LoggerFactory.getLogger(InspectionServiceImpl.class);

    @Override
    public List<Inspection> getInspectionsByTransformer(Long transformerId) {
        return inspectionRepository.findByTransformer_Id(transformerId);
    }

    @Override
    @Transactional
    public Inspection saveInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    // ***************************************************************
    // ** THE FIX IS IN THIS METHOD **
    // ***************************************************************
    @Override
    @Transactional
    public void deleteInspection(Long id) {
        logger.info("Attempting to delete inspection with ID: {}", id);

        try {
            // 1. Find the inspection (the parent)
            Optional<Inspection> inspectionOptional = inspectionRepository.findById(id);

            if (inspectionOptional.isPresent()) {
                logger.info("Inspection with ID {} found. Proceeding with full cleanup.", id);

                // --- STEP 2: DELETE ANOMALY RESULT (The common blocking record) ---
                Optional<AnomalyDetectionResult> resultOptional = anomalyDetectionResultRepository.findByInspectionId(id);
                resultOptional.ifPresent(result -> {
                    // Delete the annotated file first
                    if (result.getOutputImageName() != null) {
                        fileStorageService.delete(result.getOutputImageName());
                    }
                    anomalyDetectionResultRepository.delete(result);
                    logger.info("Associated anomaly detection result and annotated file deleted.");
                });

                // --- STEP 3: DELETE THERMAL IMAGE RECORD and FILE ---
                Optional<ThermalImage> thermalImageOptional = thermalImageRepository.findByInspectionId(id);
                if (thermalImageOptional.isPresent()) {
                    ThermalImage thermalImage = thermalImageOptional.get();

                    // Delete the original thermal image file
                    fileStorageService.delete(thermalImage.getFileName());
                    logger.info("Associated thermal image file deleted from file system.");

                    // Delete the ThermalImage database record
                    thermalImageRepository.delete(thermalImage);
                    logger.info("ThermalImage record deleted.");
                }

                // --- STEP 4: DELETE PARENT INSPECTION ---
                // After manually deleting all children, we can safely delete the parent.
                inspectionRepository.deleteById(id); // Use standard JPA method for clarity

                logger.info("Inspection with ID {} and all associated records successfully deleted.", id);

            } else {
                logger.warn("Attempted to delete non-existent inspection with ID {}.", id);
                throw new RuntimeException("Inspection not found with id: " + id);
            }
        } catch (DataIntegrityViolationException e) {
            logger.error("Failed to delete inspection due to foreign key constraint.", e);
            throw new RuntimeException("Cannot delete inspection due to related records.", e);
        } catch (Exception e) {
            logger.error("Failed to delete inspection with ID {}.", id, e);
            throw new RuntimeException("Failed to delete inspection due to an internal error.", e);
        }
    }
    // ***************************************************************
    // ***************************************************************

    @Override
    public List<InspectionDTO> getAllInspections() {
        // Fetch inspections with transformers using the custom query
        List<Inspection> inspections = inspectionRepository.findAll();

        // Map the entities to DTOs before returning
        return inspections.stream()
                .map(InspectionDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    public Inspection updateInspection(Long id, Inspection updatedInspection) {
        // Find the existing inspection by its ID
        return inspectionRepository.findById(id)
                .map(inspection -> {
                    // Update the fields with the new values
                    inspection.setInspectionNo(updatedInspection.getInspectionNo());
                    inspection.setInspectedDate(updatedInspection.getInspectedDate());
                    inspection.setMaintenanceDate(updatedInspection.getMaintenanceDate());
                    inspection.setStatus(updatedInspection.getStatus());

                    // Save the updated inspection
                    return inspectionRepository.save(inspection);
                })
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + id));
    }

    @Override
    public Optional<InspectionDTO> findInspectionById(Long id) {
        return inspectionRepository.findById(id).map(InspectionDTO::new);
    }

    @Override
    @Transactional
    public void addThermalImageToInspection(Long inspectionId, MultipartFile file, String condition, String uploader) throws Exception {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));

        if (inspection.getThermalImage() != null) {
            throw new RuntimeException("This inspection already has a thermal image.");
        }

        // 1. Store the file and get the unique filename
        String filename = fileStorageService.store(file);

        ThermalImage thermalImage = new ThermalImage();
        thermalImage.setFileName(filename);

        // 2. CRITICAL FIX: Set the file path for the entity (resolves Status 500)
        thermalImage.setFilePath(fileStorageService.getRootLocation().resolve(filename).toString());

        thermalImage.setEnvironmentalCondition(ThermalImage.EnvironmentalCondition.valueOf(condition.toUpperCase()));
        thermalImage.setImageType(ThermalImage.ImageType.MAINTENANCE);
        thermalImage.setUploadTimestamp(LocalDateTime.now());
        thermalImage.setUploaderId(uploader);

        // 3. Set the mandatory relationship
        thermalImage.setInspection(inspection);

        thermalImageRepository.save(thermalImage);
    }

    @Override
    @Transactional
    public void deleteThermalImage(Long imageId) {
        // Find the image record in the database
        ThermalImage thermalImage = thermalImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("ThermalImage not found with id: " + imageId));

        // Get the parent inspection ID and object
        Long inspectionId = thermalImage.getInspection().getId();
        Inspection inspection = thermalImage.getInspection();

        // ***************************************************************
        // ** FIX: DELETE THE ANOMALY RESULT **
        // ***************************************************************

        // Find and delete the associated anomaly detection result
        Optional<AnomalyDetectionResult> resultOptional = anomalyDetectionResultRepository.findByInspectionId(inspectionId);

        resultOptional.ifPresent(result -> {
            // Delete the physical annotated image file (e.g., from the 'annotated' subdirectory)
            if (result.getOutputImageName() != null) {
                fileStorageService.delete(result.getOutputImageName());
            }

            // Delete the result entity from the database
            anomalyDetectionResultRepository.delete(result);
            logger.info("Deleted anomaly detection result and annotated file for Inspection ID: {}", inspectionId);
        });

        // ***************************************************************

        // Delete the physical original thermal image file from the server
        fileStorageService.delete(thermalImage.getFileName());

        // Break the link from the parent inspection
        inspection.setThermalImage(null);
        inspectionRepository.save(inspection);

        // Delete the ThermalImage entity from the database
        thermalImageRepository.delete(thermalImage);
    }
}