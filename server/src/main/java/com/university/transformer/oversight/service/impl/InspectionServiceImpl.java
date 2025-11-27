package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.InspectionService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InspectionServiceImpl implements InspectionService {

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private ThermalImageRepository thermalImageRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AnomalyDetectionResultRepository anomalyDetectionResultRepository;

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

    @Override
    @Transactional
    public void deleteInspection(Long id) {
        logger.info("Attempting to delete inspection with ID: {}", id);
        try {
            Optional<Inspection> inspectionOptional = inspectionRepository.findById(id);
            if (inspectionOptional.isEmpty()) {
                logger.warn("Attempted to delete non-existent inspection with ID {}.", id);
                throw new RuntimeException("Inspection not found with id: " + id);
            }

            // Delete anomaly result and annotated file if present
            anomalyDetectionResultRepository.findByInspectionId(id).ifPresent(result -> {
                if (result.getOutputImageName() != null) {
                    fileStorageService.delete(result.getOutputImageName());
                }
                anomalyDetectionResultRepository.delete(result);
                logger.info("Associated anomaly detection result and annotated file deleted.");
            });

            // Delete thermal image record and file if present
            thermalImageRepository.findByInspectionId(id).ifPresent(thermalImage -> {
                fileStorageService.delete(thermalImage.getFileName());
                thermalImageRepository.delete(thermalImage);
                logger.info("ThermalImage file and record deleted.");
            });

            // Finally delete the parent inspection
            inspectionRepository.deleteById(id);
            logger.info("Inspection with ID {} and all associated records successfully deleted.", id);

        } catch (DataIntegrityViolationException e) {
            logger.error("Failed to delete inspection due to foreign key constraint.", e);
            throw new RuntimeException("Cannot delete inspection due to related records.", e);
        } catch (Exception e) {
            logger.error("Failed to delete inspection with ID {}.", id, e);
            throw new RuntimeException("Failed to delete inspection due to an internal error.", e);
        }
    }

    @Override
    public List<InspectionDTO> getAllInspections() {
        return inspectionRepository.findAll()
                .stream()
                .map(InspectionDTO::new)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Inspection updateInspection(Long id, Inspection updatedInspection) {
        return inspectionRepository.findById(id)
                .map(inspection -> {
                    inspection.setInspectionNo(updatedInspection.getInspectionNo());
                    inspection.setInspectedDate(updatedInspection.getInspectedDate());
                    inspection.setMaintenanceDate(updatedInspection.getMaintenanceDate());
                    inspection.setStatus(updatedInspection.getStatus());
                    inspection.setNotes(updatedInspection.getNotes());
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

        // Store file and capture unique filename
        String filename = fileStorageService.store(file);

        ThermalImage thermalImage = new ThermalImage();
        thermalImage.setFileName(filename);
        thermalImage.setFilePath(fileStorageService.getRootLocation().resolve(filename).toString());
        thermalImage.setEnvironmentalCondition(ThermalImage.EnvironmentalCondition.valueOf(condition.toUpperCase()));
        thermalImage.setImageType(ThermalImage.ImageType.MAINTENANCE);
        thermalImage.setUploadTimestamp(LocalDateTime.now());
        thermalImage.setUploaderId(uploader);
        thermalImage.setInspection(inspection);

        thermalImageRepository.save(thermalImage);
    }

    @Override
    @Transactional
    public void deleteThermalImage(Long imageId) {
        ThermalImage thermalImage = thermalImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("ThermalImage not found with id: " + imageId));

        Long inspectionId = thermalImage.getInspection().getId();
        Inspection inspection = thermalImage.getInspection();

        // Remove associated anomaly result
        anomalyDetectionResultRepository.findByInspectionId(inspectionId).ifPresent(result -> {
            if (result.getOutputImageName() != null) {
                fileStorageService.delete(result.getOutputImageName());
            }
            anomalyDetectionResultRepository.delete(result);
            logger.info("Deleted anomaly detection result and annotated file for Inspection ID: {}", inspectionId);
        });

        // Delete original thermal image file
        fileStorageService.delete(thermalImage.getFileName());

        // Break relationship from parent and persist
        inspection.setThermalImage(null);
        inspectionRepository.save(inspection);

        // Delete the ThermalImage entity
        thermalImageRepository.delete(thermalImage);
    }
}
