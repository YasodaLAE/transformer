package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.dto.AnnotationDTO;
import com.university.transformer.oversight.dto.DetectionRequest;
import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.service.AnnotationService;
import com.university.transformer.oversight.service.AnomalyDetectionService;
import com.university.transformer.oversight.service.FineTuningService;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.university.transformer.oversight.dto.AnnotationSaveRequest;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger; // 💥 Import Logger
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {
    private static final Logger logger = LoggerFactory.getLogger(InspectionController.class); // 💥 Define logger
    @Autowired
    private InspectionService inspectionService;
    @Autowired
    private AnomalyDetectionService anomalyDetectionService;
    @Autowired
    private AnnotationService annotationService;
    @Autowired
    private FineTuningService fineTuningService;
    // --- Inspection CRUD Endpoints ---

    @GetMapping
    public ResponseEntity<List<InspectionDTO>> getAllInspections() {
        List<InspectionDTO> inspections = inspectionService.getAllInspections();
        return ResponseEntity.ok(inspections);
    }

    @GetMapping("/annotations/export/all")
    public ResponseEntity<byte[]> exportAllFeedbackLog() {
        try {
            byte[] jsonBytes = annotationService.exportAllAnnotationsAsJson();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Set a dynamic filename based on the current timestamp
            String filename = "all_anomaly_feedback_" + System.currentTimeMillis() + ".json";
            headers.setContentDispositionFormData("attachment", filename);

            // Return the byte array in the response body
            return new ResponseEntity<>(jsonBytes, headers, HttpStatus.OK);

        } catch (IOException e) {
            logger.error("Failed to export all anomaly data log.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        Inspection newInspection = inspectionService.saveInspection(inspection);
        return new ResponseEntity<>(newInspection, HttpStatus.CREATED);
    }

    // NEW CORRECT SYNCHRONOUS CONTROLLER METHOD
    @PostMapping("/finetune-model")
    public ResponseEntity<String> triggerModelFineTuning() {
        try {
            // The service call (generateDatasetAndFineTune) is synchronous
            // and contains process.waitFor(), so it will block until Python finishes.
            String newModelName = fineTuningService.generateDatasetAndFineTune();
            logger.info("Fine-tuning successful. New model: {}", newModelName);

            // This response is only sent AFTER the fine-tuning is complete.
            return ResponseEntity.ok("Model fine-tuning completed successfully. New model: " + newModelName);
        } catch (RuntimeException e) {
            // This catches failure from process.waitFor() returning non-zero, etc.
            logger.error("Fine-tuning failed.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Model fine-tuning failed. Reason: " + e.getMessage());
        } catch (Exception e) {
            logger.error("Fine-tuning encountered an unexpected error.", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Model fine-tuning failed due to an error.");
        }
    }

    @GetMapping("/by-transformer/{transformerId}")
    public ResponseEntity<List<Inspection>> getInspectionsByTransformer(@PathVariable Long transformerId) {
        List<Inspection> inspections = inspectionService.getInspectionsByTransformer(transformerId);
        return ResponseEntity.ok(inspections);
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionDTO> getInspectionById(@PathVariable Long id) {
        return inspectionService.findInspectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable Long id, @RequestBody Inspection updatedInspection) {
        try {
            Inspection savedInspection = inspectionService.updateInspection(id, updatedInspection);
            return ResponseEntity.ok(savedInspection);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        try {
            inspectionService.deleteInspection(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }




    @PostMapping("/{inspectionId}/thermal-image")
    public ResponseEntity<String> uploadThermalImage(
            @PathVariable Long inspectionId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("condition") String condition,
            @RequestParam("uploader") String uploader){
        try {
            inspectionService.addThermalImageToInspection(inspectionId, file, condition, uploader);
            return ResponseEntity.status(HttpStatus.CREATED).body("Thermal image added to inspection.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }

    @DeleteMapping("/thermal-image/{imageId}")
    public ResponseEntity<Void> deleteThermalImage(@PathVariable Long imageId) {
        try {
            inspectionService.deleteThermalImage(imageId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{inspectionId}/detect-anomalies")
    public ResponseEntity<AnomalyDetectionResult> detectAnomalies(@PathVariable Long inspectionId, @RequestBody DetectionRequest request) {
        try {
            AnomalyDetectionResult result = anomalyDetectionService.runDetection(
                    inspectionId,
                    request.getBaselineFileName(),
                    request.getTempThresholdPercentage()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    @GetMapping("/{inspectionId}/anomalies")
    public ResponseEntity<AnomalyDetectionResult> getAnomalyResultByInspectionId(@PathVariable Long inspectionId) {
        return anomalyDetectionService.getDetectionResultByInspectionId(inspectionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // This endpoint serves the AI-GENERATED image
    @GetMapping("/{inspectionId}/anomalies/image")
    public ResponseEntity<Resource> viewAnnotatedAnomalyImage(@PathVariable Long inspectionId) {
        try {
            Resource file = anomalyDetectionService.loadAnnotatedImageAsResource(inspectionId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(file);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{inspectionId}/annotations")
    public ResponseEntity<List<AnnotationDTO>> getAnnotationsForInspection(@PathVariable Long inspectionId) {
        List<AnnotationDTO> annotations = annotationService.getAnnotationsByInspectionId(inspectionId);
        return ResponseEntity.ok(annotations);
    }

    @PostMapping("/{inspectionId}/annotations")
    public ResponseEntity<Void> saveAnnotationsForInspection(@PathVariable Long inspectionId, @RequestBody AnnotationSaveRequest request) {
        // Pass ONLY the final annotations list to the service
        annotationService.saveAnnotations(
                inspectionId,
                request.getFinalAnnotations()
        );
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{inspectionId}/annotations/all-for-display")
    public ResponseEntity<List<AnnotationDTO>> getAllAnnotationsForDisplay(@PathVariable Long inspectionId) {
        List<AnnotationDTO> annotations = annotationService.getAllAnnotationsForDisplay(inspectionId);
        return ResponseEntity.ok(annotations);
    }

    // --- NEW ENDPOINT FOR USER-EDITED IMAGE ---
    @GetMapping("/{inspectionId}/annotations/image")
    public ResponseEntity<Resource> viewUserAnnotatedImage(@PathVariable Long inspectionId) {
        try {
            Resource file = anomalyDetectionService.drawUserAnnotationsOnImage(inspectionId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_JPEG)
                    .header(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                    .header(HttpHeaders.PRAGMA, "no-cache")
                    .header(HttpHeaders.EXPIRES, "0")
                    .body(file);
        } catch (IOException e) {
            // Log the full error for debugging on the server
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (RuntimeException e) {
            // Catches things like "Inspection not found"
            return ResponseEntity.notFound().build();
        }
    }
}