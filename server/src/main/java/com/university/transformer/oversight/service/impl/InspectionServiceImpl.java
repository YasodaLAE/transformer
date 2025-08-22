package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class InspectionServiceImpl implements InspectionService {

    @Autowired
    private InspectionRepository inspectionRepository;
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    @Autowired
    private FileStorageService fileStorageService;

    @Override
    @Transactional
    public void deleteInspection(Long id) {
        // First, we must manually delete the physical file if it exists.
        inspectionRepository.findById(id).ifPresent(inspection -> {
            if (inspection.getThermalImage() != null) {
                fileStorageService.delete(inspection.getThermalImage().getFileName());
            }
        });

        // Now, we simply delete the inspection. The "cascade = CascadeType.ALL"
        // setting in your Inspection.java model will automatically delete the
        // thermal_image record from the database for us.
        inspectionRepository.deleteById(id);
    }


    // --- All other methods are left as they were ---

    @Override
    public List<Inspection> getInspectionsByTransformer(Long transformerId) {
        return inspectionRepository.findByTransformerId(transformerId);
    }

    @Override
    @Transactional
    public Inspection saveInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    @Override
    public Optional<InspectionDTO> findInspectionById(Long id) {
        return inspectionRepository.findById(id).map(InspectionDTO::new);
    }

    @Override
    public List<InspectionDTO> findAllInspections() {
        return inspectionRepository.findAll().stream().map(InspectionDTO::new).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addThermalImageToInspection(Long inspectionId, MultipartFile file, String condition, String uploader) throws Exception {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));
        if (inspection.getThermalImage() != null) {
            throw new RuntimeException("This inspection already has a thermal image.");
        }
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
        Inspection inspection = thermalImage.getInspection();
        if (inspection != null) {
            inspection.setThermalImage(null);
            inspectionRepository.save(inspection);
        }
        fileStorageService.delete(thermalImage.getFileName());
        thermalImageRepository.deleteById(imageId);
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
                    return inspectionRepository.save(inspection);
                })
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + id));
    }
}