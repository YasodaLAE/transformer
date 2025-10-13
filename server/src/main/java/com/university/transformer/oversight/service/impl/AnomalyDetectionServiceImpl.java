package com.university.transformer.oversight.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.university.transformer.oversight.dto.AnnotationRequest;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.AnomalyFeedback;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.ThermalImage;
import com.university.transformer.oversight.repository.AnomalyDetectionResultRepository;
import com.university.transformer.oversight.repository.AnomalyFeedbackRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.ThermalImageRepository;
import com.university.transformer.oversight.service.AnomalyDetectionService;
import com.university.transformer.oversight.service.FileStorageService;
import jakarta.persistence.Column;
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
import java.util.List;
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

    @Column(name = "original_width")
    private Integer originalWidth;

    @Column(name = "original_height")
    private Integer originalHeight;

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private ThermalImageRepository thermalImageRepository;
    @Autowired private AnomalyDetectionResultRepository resultRepository;
    @Autowired private FileStorageService fileStorageService;
    @Autowired private AnomalyFeedbackRepository feedbackRepository; // Inject the new repository


    // NOTE: This constant MUST match the one in the Python script!
    private static final String ANNOTATED_IMAGE_SUBDIR = "annotated" ;

    @Override
    @Transactional
    public AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception {
        // 1. Get the path to the maintenance image
        ThermalImage thermalImage = thermalImageRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Thermal (Maintenance) Image not found for inspection ID: " + inspectionId));

        // Use the full absolute path of the image for Python
        // Assumes FileStorageService.getRootLocation() returns the Path object for the root storage
        String maintenanceImagePath = fileStorageService.getRootLocation()
                .resolve(thermalImage.getFileName())
                .toAbsolutePath()
                .toString();

        if (baselineFileName == null || baselineFileName.isEmpty()) {
            throw new RuntimeException("Baseline Image file name is required for deference check.");
        }

        String baselineImagePath = fileStorageService.getRootLocation()
                .resolve("baseline-images") // <-- CRITICAL ADDITION
                .resolve(baselineFileName)
                .toAbsolutePath()
                .toString(); // e.g., D:/oversight/uploads/baseline-images/baseline_1_...jpg


        String outputSaveFolder = Paths.get(storageRootLocation).toAbsolutePath().toString();

        String pythonMaintenancePath = maintenanceImagePath.replace(File.separatorChar, '/');
        String pythonBaselinePath = baselineImagePath.replace(File.separatorChar, '/');
        String pythonOutputPath = outputSaveFolder.replace(File.separatorChar, '/');

        // 2. Build the Python command
        // Pass the absolute image path and the absolute root storage path
        ProcessBuilder pb = new ProcessBuilder("python", PYTHON_SCRIPT_PATH,
                pythonMaintenancePath,
                pythonBaselinePath,
                pythonOutputPath,
                String.valueOf(tempThresholdPercentage));

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
            Map<String, Object> errorMap = null;
            try {
                errorMap = objectMapper.readValue(outputString, new TypeReference<Map<String, Object>>() {});
            } catch (Exception parseE) {
                // Ignore parsing error if Python output wasn't valid JSON
            }
            throw new RuntimeException("Anomaly detection script failed.");
        }

        logger.info("Python script executed successfully. Output captured: {}", outputString);

        // 4. Parse the JSON output
        Map<String, Object> outputMap = objectMapper.readValue(outputString, new TypeReference<Map<String, Object>>() {});

        String overallStatus = (String) outputMap.get("overall_status");
        // This 'outputImageName' variable will now contain the RELATIVE path/filename
        String outputImageName = (String) outputMap.get("output_image_name");
        String detectionJson = objectMapper.writeValueAsString(outputMap.get("anomalies")); // List of bounding boxes
        Map<String, Object> dimensionsMap = (Map<String, Object>) outputMap.get("image_dimensions"); // Cast to generic Map



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

        if (dimensionsMap != null) {
            // Read the values as Longs (safest assumption for numeric JSON data)
            Integer width = (Integer) dimensionsMap.get("original_width");
            Integer height = (Integer) dimensionsMap.get("original_height");

            // If Jackson read them as Longs (which is common):
            if (dimensionsMap.get("original_width") instanceof Number) {
                width = ((Number) dimensionsMap.get("original_width")).intValue();
                height = ((Number) dimensionsMap.get("original_height")).intValue();
            }

            // Set the values to the entity
            result.setOriginalWidth(width);
            result.setOriginalHeight(height);
        }

// resultRepository.save(result) will handle UPDATE or INSERT.
        return resultRepository.save(result);
    }


    @Override
    @Transactional
    public void saveUserAnnotations(Long inspectionId, AnnotationRequest request) throws Exception {
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));

        String originalAnnotationsJson = result.getDetectionJsonOutput();
        List<Map<String, Object>> finalAnnotations = request.getFinalAnnotations();
        String annotatorUser = request.getAnnotatorUser();

        // 1. LOG THE ACTION (FR3.3) - Since we don't have the original/new status of each box,
        //    we save the *final state* as the 'EDITED' log for now.

        // In a sophisticated system, you would compare finalAnnotations against JSON.parse(originalAnnotationsJson)
        // to determine which boxes were ADDED, EDITED, or DELETED. For project scope, we log the final list.

        for (Map<String, Object> anomalyMap : finalAnnotations) {
            AnomalyFeedback feedback = new AnomalyFeedback();
            feedback.setDetectionResult(result);
            feedback.setAnnotatorUser(annotatorUser);
            feedback.setTimestamp(LocalDateTime.now());

            // Log every box in the final accepted list as a user-approved/edited box.
            // We assume any box that exists in the final list was accepted/edited by the user.
            feedback.setAction(AnomalyFeedback.AnnotationAction.USER_EDITED);
            feedback.setAnomalyDataJson(objectMapper.writeValueAsString(anomalyMap));

            feedbackRepository.save(feedback);
        }

        // 2. PERSIST THE FINAL STATE (FR3.2)
        // Update the AnomalyDetectionResult entity with the final, clean, user-validated list.
        result.setDetectionJsonOutput(objectMapper.writeValueAsString(finalAnnotations));
        result.setOverallStatus(finalAnnotations.isEmpty() ? "NORMAL" : "VALIDATED_ANOMALY"); // Update status based on user action
        result.setDetectedTimestamp(LocalDateTime.now()); // Update timestamp to reflect validation time

        resultRepository.save(result);
    }


    @Override
    public Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId) {
        // Correctly fetch the result using the Inspection ID (foreign key)
        return resultRepository.findByInspectionId(inspectionId);
    }

    // AnomalyDetectionServiceImpl.java - loadAnnotatedImageAsResource method

    @Override
    public Resource loadAnnotatedImageAsResource(Long inspectionId) {
        // 1. Get the result to find the file name
        AnomalyDetectionResult result = resultRepository.findByInspectionId(inspectionId)
                .orElseThrow(() -> new RuntimeException("Anomaly result not found for inspection ID: " + inspectionId));

        // CRITICAL FIX: The database now holds the RELATIVE path/filename
        String filename = result.getOutputImageName();

        // 2. Load the file using the service
        try {
            // The FileStorageService must now resolve the filename against the root.
            // Assuming your FileStorageService.loadAsResource(filename) is smart enough
            // to automatically combine the filename with the root path.
            // If not, you may need a path resolution step here before calling the service.

            // If FileStorageService.loadAsResource() takes just a filename and resolves it:
            return fileStorageService.loadAsResource(filename);

            // If FileStorageService.loadAsResource() requires the full path:
            /*
            Path absolutePath = Paths.get(storageRootLocation).resolve(filename);
            return fileStorageService.loadAsResource(absolutePath.toString());
            */

            // Use the simpler assumption based on standard Spring file services:
            // The service is expected to handle locating files based on the relative name.

        } catch (Exception e) {
            logger.error("Could not load annotated image file: {}", filename, e);
            throw new RuntimeException("Could not load annotated image file.");
        }
    }
}