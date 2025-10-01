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
import java.io.InputStreamReader;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.nio.file.Paths;

@Service
public class AnomalyDetectionServiceImpl implements AnomalyDetectionService {

    private static final Logger logger = LoggerFactory.getLogger(AnomalyDetectionServiceImpl.class);
    private static final String PYTHON_SCRIPT_PATH = "D:/oversight/server/src/main/resources/detector.py";
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${storage.root-location}")
    private String storageRootLocation;

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private ThermalImageRepository thermalImageRepository;
    @Autowired private AnomalyDetectionResultRepository resultRepository;
    @Autowired private FileStorageService fileStorageService;

    // NOTE: This constant MUST match the one in the Python script!
    private static final String ANNOTATED_IMAGE_SUBDIR = "annotated" ;

    @Override
    @Transactional
    public AnomalyDetectionResult runDetection(Long inspectionId) throws Exception {
        // 1. Get the path to the maintenance image
        ThermalImage thermalImage = thermalImageRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Thermal (Maintenance) Image not found for inspection ID: " + inspectionId));

        // Use the full absolute path of the image for Python
        // Assumes FileStorageService.getRootLocation() returns the Path object for the root storage
        String maintenanceImagePath = fileStorageService.getRootLocation()
                .resolve(thermalImage.getFileName())
                .toAbsolutePath()
                .toString();

        // 2. Build the Python command
        // Pass the absolute image path and the absolute root storage path
        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT_PATH,
                maintenanceImagePath,
                Paths.get(storageRootLocation).toAbsolutePath().toString());

        Process p = pb.start();

        // 3. Capture Python Output (JSON)
        BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()));
        StringBuilder output = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }
        String outputString = output.toString();

        int exitCode = p.waitFor();
        if (exitCode != 0) {
            // Log error output from Python (for debugging)
            BufferedReader errorReader = new BufferedReader(new InputStreamReader(p.getErrorStream()));
            String errorOutput = errorReader.lines().reduce("", (a, b) -> a + b + "\n");
            logger.error("Python script failed with exit code {}. Error:\n{}", exitCode, errorOutput);
            throw new RuntimeException("Anomaly detection script failed.");
        }

        logger.info("Python script executed successfully. Output captured: {}", outputString);

        // 4. Parse the JSON output
        Map<String, Object> outputMap = objectMapper.readValue(outputString, new TypeReference<Map<String, Object>>() {});

        String overallStatus = (String) outputMap.get("overall_status");
        String outputImageName = (String) outputMap.get("output_image_name"); // Relative path from Python
        String detectionJson = objectMapper.writeValueAsString(outputMap.get("anomalies")); // List of bounding boxes

        // 5. Store the result - UPSERT LOGIC
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found."));

        // Check for existing result and update. If none found, create a new one.
        // We use orElseGet() to ensure 'inspection' is only set on a new entity.
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseGet(() -> {
                    // This block executes ONLY if the result doesn't exist yet (INSERT case)
                    AnomalyDetectionResult newResult = new AnomalyDetectionResult();
                    newResult.setInspection(inspection); // Set the required foreign key on creation
                    return newResult;
                });

        // Update the transient data fields regardless of whether it's new or existing
        result.setOverallStatus(overallStatus);
        result.setDetectionJsonOutput(detectionJson);
        // Note: The python output is currently saving the ABSOLUTE path. It's better to save
        // a relative path/filename if possible, but for now we rely on the implementation
        // of fileStorageService.loadAsResource() to handle this path.
        result.setOutputImageName(outputImageName);
        result.setDetectedTimestamp(LocalDateTime.now());

        // resultRepository.save(result) will handle UPDATE if result has an ID, or INSERT if it's new.
        return resultRepository.save(result);
    }

        // 5. Store the result
        //Inspection inspection = inspectionRepository.findById(inspectionId)
        //        .orElseThrow(() -> new RuntimeException("Inspection not found."));

        // Check for existing result and update (safer than always inserting)
        //AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
        //        .orElse(new AnomalyDetectionResult());

        //result.setInspection(inspection);
        //result.setOverallStatus(overallStatus);
        //result.setDetectionJsonOutput(detectionJson);
        //result.setOutputImageName(outputImageName); // Store the relative path
        //result.setDetectedTimestamp(LocalDateTime.now());

        //return resultRepository.save(result);
    //}

    @Override
    public Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId) {
        // Correctly fetch the result using the Inspection ID (foreign key)
        return resultRepository.findByInspectionId(inspectionId);
    }

    @Override
    public Resource loadAnnotatedImageAsResource(Long inspectionId) {
        // 1. Get the result to find the file name
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));

        String filename = result.getOutputImageName(); // This is the relative path (e.g., annotated-results/file.jpg)

        // 2. Load the file using the service, which must handle the sub-directory path
        try {
            // Assuming fileStorageService.loadAsResource(filename) can handle the relative path saved in the database
            return fileStorageService.loadAsResource(filename);
        } catch (Exception e) {
            logger.error("Could not load annotated image file: {}", filename, e);
            throw new RuntimeException("Could not load annotated image file.");
        }
    }
}