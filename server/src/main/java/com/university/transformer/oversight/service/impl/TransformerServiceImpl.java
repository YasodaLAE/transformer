package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.repository.TransformerRepository;
import com.university.transformer.oversight.service.FileStorageService;
import com.university.transformer.oversight.service.TransformerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
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
        transformer.setDetails(transformerDetails.getDetails());
        transformer.setCapacity(transformerDetails.getCapacity());
        transformer.setNoOfFeeders(transformerDetails.getNoOfFeeders());

        return transformerRepository.save(transformer);
    }

    @Override
    public void deleteTransformer(Long id) {
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
            String uniqueFileName = "baseline_" + transformerId + "_" + System.currentTimeMillis() + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), filePath);

            transformer.setBaselineImageName(uniqueFileName);
            transformer.setBaselineImageCondition(condition);
            transformer.setBaselineImageUploader(uploader);
            transformer.setBaselineImageUploadTimestamp(LocalDateTime.now());
            transformerRepository.save(transformer);
        } catch (IOException e) {
            throw new RuntimeException("Could not store baseline image: " + e.getMessage());
        }
    }

    @Override
    public void deleteBaselineImage(Long transformerId) {
        Transformer transformer = transformerRepository.findById(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        String fileName = transformer.getBaselineImageName();
        if (fileName != null && !fileName.isEmpty()) {
            try {
                Path filePath = Paths.get("uploads/baseline-images/").resolve(fileName);
                Files.deleteIfExists(filePath);
                transformer.setBaselineImageName(null);
                transformer.setBaselineImageCondition(null);
                transformer.setBaselineImageUploader(null);
                transformer.setBaselineImageUploadTimestamp(null);
                transformerRepository.save(transformer);
            } catch (IOException e) {
                throw new RuntimeException("Could not delete baseline image file: " + e.getMessage());
            }
        }
    }

//    @Override
//    public Resource loadBaselineImageAsResource(Long transformerId) {
//        Transformer transformer = transformerRepository.findById(transformerId)
//                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));
//        return fileStorageService.loadAsResource(transformer.getBaselineImageName());
//    }

    // --- CORRECTED METHOD ---
    @Override
    public Resource loadBaselineImageAsResource(Long transformerId) {
        Transformer transformer = transformerRepository.findById(transformerId)
                .orElseThrow(() -> new RuntimeException("Transformer not found with ID: " + transformerId));

        String filename = transformer.getBaselineImageName();
        if (filename == null || filename.isEmpty()) {
            throw new RuntimeException("No baseline image found for transformer ID: " + transformerId);
        }

        try {
            // look in the dedicated baseline images directory
            Path baselineImageDir = Paths.get("uploads/baseline-images/");
            Path file = baselineImageDir.resolve(filename).normalize();
            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read baseline image file: " + filename);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error reading baseline image file: " + e.getMessage());
        }
    }
}
