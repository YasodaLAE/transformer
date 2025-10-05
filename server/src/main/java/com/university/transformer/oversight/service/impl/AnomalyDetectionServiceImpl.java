package com.university.transformer.oversight.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.AnomalyDetectionService;
import com.university.transformer.oversight.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.nio.file.Paths;

@Service
public class AnomalyDetectionServiceImpl implements AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionServiceImpl.class);
    private static final String PYTHON_SCRIPT_PATH = "./server/src/main/resources/detector.py";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${storage.root-location}")
    private String storageRootLocation;

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private ThermalImageRepository thermalImageRepository;
    @Autowired private AnomalyDetectionResultRepository resultRepository;
    @Autowired private FileStorageService fileStorageService;

    // Keep for compatibility if other components rely on this constant.
    private static final String ANNOTATED_IMAGE_SUBDIR = "annotated";

    @Override
    @Transactional
    public AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception {
        // 1) Fetch maintenance image tied to the inspection
        ThermalImage thermalImage = thermalImageRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Thermal (Maintenance) Image not found for inspection ID: " + inspectionId));

        String maintenanceImagePath = fileStorageService.getRootLocation()
                .resolve(thermalImage.getFileName())
                .toAbsolutePath()
                .toString();

        if (baselineFileName == null || baselineFileName.isEmpty()) {
            throw new RuntimeException("Baseline Image file name is required for deference check.");
        }

        String baselineImagePath = fileStorageService.getRootLocation()
                .resolve("baseline-images")
                .resolve(baselineFileName)
                .toAbsolutePath()
                .toString();

        String outputSaveFolder = Paths.get(storageRootLocation).toAbsolutePath().toString();

        // Normalize separators for Python
        String pythonMaintenancePath = maintenanceImagePath.replace(File.separatorChar, '/');
        String pythonBaselinePath = baselineImagePath.replace(File.separatorChar, '/');
        String pythonOutputPath = outputSaveFolder.replace(File.separatorChar, '/');

        // 2) Execute Python script
        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT_PATH,
                pythonMaintenancePath,
                pythonBaselinePath,
                pythonOutputPath,
                String.valueOf(tempThresholdPercentage));

        Process p = pb.start();

        // 3) Capture Python stdout (expected JSON)
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        StringBuilder output = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }
        String outputString = output.toString();

        int exitCode = p.waitFor();

        if (exitCode != 0) {
            // Log stderr to aid debugging
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(p.getErrorStream()));
            String errorOutput = errorReader.lines().reduce("", (a, b) -> a + b + "\n");
            logger.error("Python script failed with exit code {}. Error:\n{}", exitCode, errorOutput);

            try {
                // If Python printed JSON with error details, try to parse (optional)
                objectMapper.readValue(outputString, new TypeReference<Map<String, Object>>() {});
            } catch (Exception ignored) {
                // Ignore if not valid JSON
            }
            throw new RuntimeException("Anomaly detection script failed.");
        }

        logger.info("Python script executed successfully. Output captured: {}", outputString);

        // 4) Parse JSON output
        Map<String, Object> outputMap = objectMapper.readValue(outputString, new TypeReference<Map<String, Object>>() {});
        String overallStatus = (String) outputMap.get("overall_status");
        String outputImageName = (String) outputMap.get("output_image_name"); // relative path/filename
        String detectionJson = objectMapper.writeValueAsString(outputMap.get("anomalies"));

        // 5) Upsert result for the inspection
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found."));

        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseGet(() -> {
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
        // Load the annotated image via stored relative filename
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));

        String filename = result.getOutputImageName();

        try {
            // Assumes FileStorageService resolves the filename against the root.
            return fileStorageService.loadAsResource(filename);
        } catch (Exception e) {
            logger.error("Could not load annotated image file: {}", filename, e);
            throw new RuntimeException("Could not load annotated image file.");
        }
    }
}
