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
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InspectionServiceImpl implements InspectionService {

    @Autowired
    private InspectionRepository inspectionRepository;
    @Autowired
    private ThermalImageRepository thermalImageRepository;
    @Autowired
    private FileStorageService fileStorageService;

    @Override
    public List<Inspection> getInspectionsByTransformer(Long transformerId) {
        return inspectionRepository.findByTransformerId(transformerId);
    }

    @Override
    public Inspection saveInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    @Override
    public void deleteInspection(Long id) {
        inspectionRepository.deleteById(id);
    }

    @Override
    public Optional<InspectionDTO> findInspectionById(Long id) {
        return inspectionRepository.findById(id).map(InspectionDTO::new);
    }

    @Override
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
    public void deleteThermalImage(Long imageId) {
        // Find the image record in the database
        ThermalImage thermalImage = thermalImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("ThermalImage not found with id: " + imageId));

        // Get the parent inspection
        Inspection inspection = thermalImage.getInspection();

        // Delete the physical file from the server
        fileStorageService.delete(thermalImage.getFileName());

        // --- ADD THIS LOGIC ---
        // Break the link from the parent inspection
        inspection.setThermalImage(null);
        inspectionRepository.save(inspection);
    }
}