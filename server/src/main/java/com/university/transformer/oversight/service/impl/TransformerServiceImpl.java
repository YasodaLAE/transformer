package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.model.ThermalImage.EnvironmentalCondition;
import com.university.transformer.oversight.model.ThermalImage.ImageType;
import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.repository.TransformerRepository;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.TransformerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.net.MalformedURLException;

@Service
public class TransformerServiceImpl implements TransformerService {

    @Autowired
    private TransformerRepository transformerRepository;

    @Autowired
    private ThermalImageRepository thermalImageRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Override
    public Transformer saveTransformer(Transformer transformer) {
        return transformerRepository.save(transformer);
    }

    @Override
    public List<Transformer> findAllTransformers() {
        return transformerRepository.findAll();
    }

    @Override
    public Optional<Transformer> findTransformerById(Long id) {
        return transformerRepository.findById(id);
    }

    @Override
    public Transformer updateTransformer(Long id, Transformer transformerDetails) {
        Transformer transformer = transformerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transformer not found with id: " + id));

        transformer.setTransformerId(transformerDetails.getTransformerId());
        transformer.setPoleId(transformerDetails.getPoleId());
        transformer.setRegion(transformerDetails.getRegion());
        transformer.setTransformerType(transformerDetails.getTransformerType());

        return transformerRepository.save(transformer);
    }

    @Override
    public void deleteTransformer(Long id) {
        if (!transformerRepository.existsById(id)) {
            throw new RuntimeException("Transformer not found with id: " + id);
        }
        transformerRepository.deleteById(id);
    }

    @Override
    public void saveBaselineImage(Long transformerId, MultipartFile file, String condition, String uploader) {
        Transformer transformer = transformerRepository.findById(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        try {
            String uploadDir = "uploads/baseline-images/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String uniqueFileName = String.format(
                    "transformer-%d_%s_%d%s",
                    transformerId,
                    condition.replaceAll("\\s+", "_"),
                    System.currentTimeMillis(),
                    extension
            );

            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            transformer.setBaselineImageName(uniqueFileName);
            transformer.setBaselineImageCondition(condition);
            transformer.setBaselineImageUploader(uploader);
            transformer.setBaselineImageUploadTimestamp(LocalDateTime.now());
            transformerRepository.save(transformer);

        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void deleteBaselineImage(Long transformerId) {
        Transformer transformer = transformerRepository.findById(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        String fileName = transformer.getBaselineImageName();
        if (fileName != null && !fileName.isEmpty()) {
            try {
                Path filePath = Paths.get("uploads/baseline-images/").resolve(fileName);
                Files.delete(filePath);
                transformer.setBaselineImageName(null);
                transformer.setBaselineImageCondition(null);
                transformer.setBaselineImageUploader(null); // Clear uploader
                transformer.setBaselineImageUploadTimestamp(null); // Clear timestamp
                transformerRepository.save(transformer);
            } catch (IOException e) {
                throw new RuntimeException("Could not delete the file: " + fileName);
            }
        }
    }

    @Override
    public Resource loadBaselineImageAsResource(Long transformerId) {
        try {
            Transformer transformer = transformerRepository.findById(transformerId)
                    .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

            String fileName = transformer.getBaselineImageName();
            if (fileName == null || fileName.isEmpty()) {
                throw new RuntimeException("No baseline image found for this transformer.");
            }

            Path filePath = Paths.get("uploads/baseline-images/").resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read the file: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error loading file: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void addImageToTransformer(String transformerId, MultipartFile file, ImageType imageType, EnvironmentalCondition condition, String uploaderId) {
        // Find the transformer by its business ID
        Transformer transformer = transformerRepository.findByTransformerId(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        // Store the physical file using the storage service
        String fileName = fileStorageService.store(file);
        String filePath = "uploads/" + fileName;

        // Create and save the metadata entity
        ThermalImage thermalImage = new ThermalImage();
        thermalImage.setFileName(fileName);
        thermalImage.setFilePath(filePath);
        thermalImage.setImageType(imageType);
        thermalImage.setEnvironmentalCondition(condition);
        thermalImage.setUploadTimestamp(LocalDateTime.now());
        thermalImage.setUploaderId(uploaderId);
        thermalImage.setTransformer(transformer);

        thermalImageRepository.save(thermalImage);
    }
    @Override
    public void saveThermalImage(String transformerId, MultipartFile file, EnvironmentalCondition condition, String uploader) throws Exception {
        // 1. Find the transformer this image belongs to
//        Transformer transformer = transformerRepository.findById(transformerId)
        Transformer transformer = transformerRepository.findByTransformerId(transformerId)
                .orElseThrow(() -> new RuntimeException("Error: Transformer not found with id: " + transformerId));

        // 2. Store the physical file on the server
        String filename = fileStorageService.store(file);

        // 3. Create a new database record for the thermal image
        ThermalImage thermalImage = new ThermalImage();
        thermalImage.setFileName(filename);
        thermalImage.setFilePath(fileStorageService.getRootLocation().resolve(filename).toString());
        thermalImage.setEnvironmentalCondition(condition);
        thermalImage.setImageType(ThermalImage.ImageType.MAINTENANCE); // Set the type
        thermalImage.setUploadTimestamp(LocalDateTime.now());
        thermalImage.setUploaderId(uploader);
        thermalImage.setTransformer(transformer); // Link it to the parent transformer

        // 4. Save the record to the database
        thermalImageRepository.save(thermalImage);
    }

    @Override
    public void deleteThermalImage(Long imageId) {
        // Find the image record in the database
        ThermalImage thermalImage = thermalImageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("ThermalImage not found with id: " + imageId));

        // Delete the physical file from the server
        fileStorageService.delete(thermalImage.getFileName());

        // Delete the record from the database
        thermalImageRepository.delete(thermalImage);
    }
}