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

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

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

//    @Override
//    public Optional<Transformer> findByTransformerId(String transformerId) {
//        return transformerRepository.findByTransformerId(transformerId);
//    }

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
    public void saveBaselineImage(Long transformerId, MultipartFile file) {
        Transformer transformer = transformerRepository.findById(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        try {
            // Define the directory to store images (create it if it doesn't exist)
            String uploadDir = "uploads/baseline-images/";
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Save the file to the file system
            Path filePath = uploadPath.resolve(file.getOriginalFilename());
            Files.copy(file.getInputStream(), filePath);

            // Update the transformer entity with the image's filename
            transformer.setBaselineImageName(file.getOriginalFilename());
            transformerRepository.save(transformer);
        } catch (IOException e) {
            throw new RuntimeException("Could not store the file. Error: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public void addImageToTransformer(String transformerId, MultipartFile file, ImageType imageType, EnvironmentalCondition condition, String uploaderId) {
        // 1. Find the transformer by its business ID
        Transformer transformer = transformerRepository.findByTransformerId(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        // 2. Store the physical file using the storage service
        String fileName = fileStorageService.store(file);
        String filePath = "uploads/" + fileName; // Or a more dynamic path

        // 3. Create and save the metadata entity
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
}
