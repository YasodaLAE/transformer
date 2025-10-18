package com.university.transformer.oversight.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.AnomalyDetectionService;
import com.university.transformer.oversight.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AnomalyDetectionServiceImpl implements AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionServiceImpl.class);
    // Use a more robust path for the script
    private static final String PYTHON_SCRIPT_PATH = new File("server/src/main/resources/detector.py").getAbsolutePath();
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final InspectionRepository inspectionRepository;
    private final ThermalImageRepository thermalImageRepository;
    private final AnomalyDetectionResultRepository resultRepository;
    private final FileStorageService fileStorageService;
    private final AnnotationRepository annotationRepository;

    @Autowired
    public AnomalyDetectionServiceImpl(
            InspectionRepository inspectionRepository,
            ThermalImageRepository thermalImageRepository,
            AnomalyDetectionResultRepository resultRepository,
            FileStorageService fileStorageService,
            AnnotationRepository annotationRepository) {
        this.inspectionRepository = inspectionRepository;
        this.thermalImageRepository = thermalImageRepository;
        this.resultRepository = resultRepository;
        this.fileStorageService = fileStorageService;
        this.annotationRepository = annotationRepository;
    }

    @Override
    @Transactional
    public AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception {
        ThermalImage thermalImage = thermalImageRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Thermal (Maintenance) Image not found for inspection ID: " + inspectionId));

        // Get paths directly from the FileStorageService for consistency
        Path rootLocation = fileStorageService.getRootLocation();
        String maintenanceImagePath = rootLocation.resolve(thermalImage.getFileName()).toAbsolutePath().toString();

        if (baselineFileName == null || baselineFileName.isEmpty()) {
            throw new RuntimeException("Baseline Image file name is required for deference check.");
        }
        String baselineImagePath = rootLocation.resolve("baseline-images").resolve(baselineFileName).toAbsolutePath().toString();
        String outputSaveFolder = rootLocation.toAbsolutePath().toString();

        // Normalize separators for Python
        String pythonMaintenancePath = maintenanceImagePath.replace(File.separatorChar, '/');
        String pythonBaselinePath = baselineImagePath.replace(File.separatorChar, '/');
        String pythonOutputPath = outputSaveFolder.replace(File.separatorChar, '/');

        logger.info("Executing Python script at: {}", PYTHON_SCRIPT_PATH);
        logger.info("With maintenance image: {}", pythonMaintenancePath);
        logger.info("With baseline image: {}", pythonBaselinePath);

        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT_PATH, pythonMaintenancePath, pythonBaselinePath, pythonOutputPath, String.valueOf(tempThresholdPercentage));
        Process p = pb.start();

        // Capture output and errors
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        StringBuilder output = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }
        String outputString = output.toString();
        int exitCode = p.waitFor();

        if (exitCode != 0) {
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(p.getErrorStream()));
            String errorOutput = errorReader.lines().reduce("", (a, b) -> a + "\n");
            logger.error("Python script failed with exit code {}. Error:\n{}", exitCode, errorOutput);
            throw new RuntimeException("Anomaly detection script failed. Check server logs for details from the Python script.");
        }

        logger.info("Python script executed successfully. Output: {}", outputString);

        Map<String, Object> outputMap = objectMapper.readValue(outputString, new TypeReference<>() {});
        String overallStatus = (String) outputMap.get("overall_status");
        String outputImageName = (String) outputMap.get("output_image_name");
        String detectionJson = objectMapper.writeValueAsString(outputMap.get("anomalies"));
        Inspection inspection = inspectionRepository.findById(inspectionId).orElseThrow(() -> new RuntimeException("Inspection not found."));

        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId).orElseGet(() -> {
            AnomalyDetectionResult newResult = new AnomalyDetectionResult();
            newResult.setInspection(inspection);
            return newResult;
        });

        result.setOverallStatus(overallStatus);
        result.setDetectionJsonOutput(detectionJson);
        result.setOutputImageName(outputImageName);
        result.setDetectedTimestamp(LocalDateTime.now());
        return resultRepository.save(result);
    }

    @Override
    public Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId) {
        return resultRepository.findByInspectionId(inspectionId);
    }

    @Override
    public Resource loadAnnotatedImageAsResource(Long inspectionId) {
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));
        String filename = result.getOutputImageName();
        try {
            return fileStorageService.loadAsResource(filename);
        } catch (Exception e) {
            throw new RuntimeException("Could not load annotated image file: " + filename, e);
        }
    }

    @Override
    public Resource drawUserAnnotationsOnImage(Long inspectionId) throws IOException {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found with id: " + inspectionId));
        if (inspection.getThermalImage() == null || inspection.getThermalImage().getFileName() == null) {
            throw new FileNotFoundException("Original thermal image not found for inspection: " + inspectionId);
        }
        Path originalImagePath = fileStorageService.getRootLocation().resolve(inspection.getThermalImage().getFileName());
        if (!Files.exists(originalImagePath)) {
            throw new FileNotFoundException("Image file not found at: " + originalImagePath);
        }
        BufferedImage image = ImageIO.read(originalImagePath.toFile());
        Graphics2D g2d = image.createGraphics();
        List<Annotation> annotations = annotationRepository.findByInspectionId(inspectionId);
        g2d.setColor(Color.RED);
        g2d.setStroke(new BasicStroke(2));
        g2d.setFont(new Font("Arial", Font.BOLD, 18));
        int count = 1;
        for (Annotation annotation : annotations) {
            int x = (int) annotation.getX();
            int y = (int) annotation.getY();
            int width = (int) annotation.getWidth();
            int height = (int) annotation.getHeight();
            g2d.drawRect(x, y, width, height);
            g2d.drawString(String.valueOf(count++), x + 5, y + 20);
        }
        g2d.dispose();
        Path userAnnotatedPath = fileStorageService.getRootLocation().resolve(inspectionId + "_user_annotated.png");
        ImageIO.write(image, "png", userAnnotatedPath.toFile());
        try {
            Resource resource = new UrlResource(userAnnotatedPath.toUri());
            if (resource.exists() || resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read the generated user-annotated file!");
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Error creating URL for user-annotated file: " + e.getMessage(), e);
        }
    }
}
//
//package com.university.transformer.oversight.service.impl;
//
//
//import com.fasterxml.jackson.core.type.TypeReference;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.university.transformer.oversight.model.Annotation;
//import com.university.transformer.oversight.model.AnomalyDetectionResult;
//import com.university.transformer.oversight.model.Inspection;
//import com.university.transformer.oversight.model.ThermalImage;
//import com.university.transformer.oversight.repository.AnnotationRepository;
//import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
//import com.university.transformer.oversight.repository.InspectionRepository;
//import com.university.transformer.oversight.repository.ThermalImageRepository;
//import com.university.transformer.oversight.service.AnomalyDetectionService;
//import com.university.transformer.oversight.service.FileStorageService;
//import org.slf4j.Logger;
//import org.slf4j.LoggerFactory;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.core.io.Resource;
//import org.springframework.core.io.UrlResource;
//import org.springframework.stereotype.Service;
//import jakarta.transaction.Transactional;
//
//import javax.imageio.ImageIO;
//import java.awt.*;
//import java.awt.image.BufferedImage;
//import java.io.BufferedReader;
//import java.io.File;
//import java.io.FileNotFoundException;
//import java.io.IOException;
//import java.io.InputStreamReader;
//import java.net.MalformedURLException;
//import java.nio.file.Files;
//import java.nio.file.Path;
//import java.time.LocalDateTime;
//import java.util.List;
//import java.util.Map;
//import java.util.Optional;
//
//@Service
//public class AnomalyDetectionServiceImpl implements AnomalyDetectionService {
//
//    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionServiceImpl.class);
//    private static final String PYTHON_SCRIPT_PATH = new File("server/src/main/resources/detector.py").getAbsolutePath();
//    private final ObjectMapper objectMapper = new ObjectMapper();
//
//    private final InspectionRepository inspectionRepository;
//    private final ThermalImageRepository thermalImageRepository;
//    private final AnomalyDetectionResultRepository resultRepository;
//    private final FileStorageService fileStorageService;
//    private final AnnotationRepository annotationRepository;
//
//    @Autowired
//    public AnomalyDetectionServiceImpl(
//            InspectionRepository inspectionRepository,
//            ThermalImageRepository thermalImageRepository,
//            AnomalyDetectionResultRepository resultRepository,
//            FileStorageService fileStorageService,
//            AnnotationRepository annotationRepository) {
//        this.inspectionRepository = inspectionRepository;
//        this.thermalImageRepository = thermalImageRepository;
//        this.resultRepository = resultRepository;
//        this.fileStorageService = fileStorageService;
//        this.annotationRepository = annotationRepository;
//    }
//
//    @Override
//    @Transactional
//    public AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception {
//        ThermalImage thermalImage = thermalImageRepository.findByInspectionId(inspectionId)
//                .orElseThrow(() -> new RuntimeException("Thermal (Maintenance) Image not found for inspection ID: " + inspectionId));
//
//        Path rootLocation = fileStorageService.getRootLocation();
//        String maintenanceImagePath = rootLocation.resolve(thermalImage.getFileName()).toAbsolutePath().toString();
//
//        if (baselineFileName == null || baselineFileName.isEmpty()) {
//            throw new RuntimeException("Baseline Image file name is required for deference check.");
//        }
//        String baselineImagePath = rootLocation.resolve("baseline-images").resolve(baselineFileName).toAbsolutePath().toString();
//        String outputSaveFolder = rootLocation.toAbsolutePath().toString();
//
//        String pythonMaintenancePath = maintenanceImagePath.replace(File.separatorChar, '/');
//        String pythonBaselinePath = baselineImagePath.replace(File.separatorChar, '/');
//        String pythonOutputPath = outputSaveFolder.replace(File.separatorChar, '/');
//
//        logger.info("Executing Python script at: {}", PYTHON_SCRIPT_PATH);
//        logger.info("With maintenance image: {}", pythonMaintenancePath);
//        logger.info("With baseline image: {}", pythonBaselinePath);
//
//        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT_PATH, pythonMaintenancePath, pythonBaselinePath, pythonOutputPath, String.valueOf(tempThresholdPercentage));
//        Process p = pb.start();
//
//        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
//        StringBuilder output = new StringBuilder();
//        String line;
//        while ((line = reader.readLine()) != null) {
//            output.append(line);
//        }
//        String outputString = output.toString();
//        int exitCode = p.waitFor();
//
//        if (exitCode != 0) {
//            BufferedReader errorReader = new BufferedReader(new InputStreamReader(p.getErrorStream()));
//            String errorOutput = errorReader.lines().reduce("", (a, b) -> a + "\n");
//            logger.error("Python script failed with exit code {}. Error:\n{}", exitCode, errorOutput);
//            throw new RuntimeException("Anomaly detection script failed. Check server logs for details from the Python script.");
//        }
//
//        logger.info("Python script executed successfully. Output: {}", outputString);
//
//        Map<String, Object> outputMap = objectMapper.readValue(outputString, new TypeReference<>() {});
//        String overallStatus = (String) outputMap.get("overall_status");
//        String outputImageName = (String) outputMap.get("output_image_name");
//        String detectionJson = objectMapper.writeValueAsString(outputMap.get("anomalies"));
//        Inspection inspection = inspectionRepository.findById(inspectionId).orElseThrow(() -> new RuntimeException("Inspection not found."));
//
//        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId).orElseGet(() -> {
//            AnomalyDetectionResult newResult = new AnomalyDetectionResult();
//            newResult.setInspection(inspection);
//            return newResult;
//        });
//
//        result.setOverallStatus(overallStatus);
//        result.setDetectionJsonOutput(detectionJson);
//        result.setOutputImageName(outputImageName);
//        result.setDetectedTimestamp(LocalDateTime.now());
//        return resultRepository.save(result);
//    }
//
//    @Override
//    public Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId) {
//        return resultRepository.findByInspectionId(inspectionId);
//    }
//
//    @Override
//    public Resource loadAnnotatedImageAsResource(Long inspectionId) {
//        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
//                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));
//        String filename = result.getOutputImageName();
//        try {
//            return fileStorageService.loadAsResource(filename);
//        } catch (Exception e) {
//            throw new RuntimeException("Could not load annotated image file: " + filename, e);
//        }
//    }
//
//    @Override
//    public Resource drawUserAnnotationsOnImage(Long inspectionId) throws IOException {
//        logger.info("[DEBUG] Starting drawUserAnnotationsOnImage for inspection ID: {}", inspectionId);
//
//        Inspection inspection = inspectionRepository.findById(inspectionId)
//                .orElseThrow(() -> {
//                    logger.error("[DEBUG] Inspection not found with id: {}", inspectionId);
//                    return new RuntimeException("Inspection not found with id: " + inspectionId);
//                });
//
//        if (inspection.getThermalImage() == null || inspection.getThermalImage().getFileName() == null) {
//            logger.error("[DEBUG] Original thermal image not found for inspection: {}", inspectionId);
//            throw new FileNotFoundException("Original thermal image not found for inspection: " + inspectionId);
//        }
//
//        Path originalImagePath = fileStorageService.getRootLocation().resolve(inspection.getThermalImage().getFileName());
//        logger.info("[DEBUG] Loading original image from path: {}", originalImagePath.toAbsolutePath());
//
//        if (!Files.exists(originalImagePath)) {
//            logger.error("[DEBUG] Image file does NOT exist at path: {}", originalImagePath.toAbsolutePath());
//            throw new FileNotFoundException("Image file not found at: " + originalImagePath);
//        }
//
//        BufferedImage image = ImageIO.read(originalImagePath.toFile());
//        Graphics2D g2d = image.createGraphics();
//
//        List<Annotation> annotations = annotationRepository.findByInspectionId(inspectionId);
//        logger.info("[DEBUG] Found {} user annotations to draw.", annotations.size());
//
//        g2d.setColor(Color.RED);
//        g2d.setStroke(new BasicStroke(2));
//        g2d.setFont(new Font("Arial", Font.BOLD, 18));
//
//        int count = 1;
//        for (Annotation annotation : annotations) {
//            g2d.drawRect((int) annotation.getX(), (int) annotation.getY(), (int) annotation.getWidth(), (int) annotation.getHeight());
//            g2d.drawString(String.valueOf(count++), (int) annotation.getX() + 5, (int) annotation.getY() + 20);
//        }
//        g2d.dispose();
//
//        Path userAnnotatedPath = fileStorageService.getRootLocation().resolve(inspectionId + "_user_annotated.png");
//        logger.info("[DEBUG] Attempting to save new annotated image to: {}", userAnnotatedPath.toAbsolutePath());
//
//        boolean success = ImageIO.write(image, "png", userAnnotatedPath.toFile());
//        logger.info("[DEBUG] ImageIO.write operation success: {}", success);
//
//        try {
//            Resource resource = new UrlResource(userAnnotatedPath.toUri());
//            if (resource.exists() && resource.isReadable()) {
//                logger.info("[DEBUG] Successfully created and loaded resource from: {}", userAnnotatedPath.toAbsolutePath());
//                return resource;
//            } else {
//                logger.error("[DEBUG] FAILED to load resource. resource.exists() returned false for path: {}", userAnnotatedPath.toAbsolutePath());
//                throw new RuntimeException("Could not read the generated user-annotated file!");
//            }
//        } catch (MalformedURLException e) {
//            logger.error("[DEBUG] MalformedURLException for path: {}", userAnnotatedPath.toAbsolutePath(), e);
//            throw new RuntimeException("Error creating URL for user-annotated file: " + e.getMessage(), e);
//        }
//    }
//}