package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.AnomalyDetectionResult;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import com.university.transformer.oversight.dto.DetectionRequest; // 🚀 NEW IMPORT
import java.util.Optional;


import com.university.transformer.oversight.service.AnomalyDetectionService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {
    @Autowired
    private InspectionService inspectionService;

    @GetMapping
    public ResponseEntity<List<InspectionDTO>> getAllInspections() {
        List<InspectionDTO> inspections = inspectionService.getAllInspections();
        return ResponseEntity.ok(inspections);
    }

    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        System.out.println("Received raw JSON payload: " + inspection.toString());
        Inspection newInspection = inspectionService.saveInspection(inspection);
        return new ResponseEntity<>(newInspection, HttpStatus.CREATED);
    }

    @GetMapping("/by-transformer/{transformerId}")
    public ResponseEntity<List<Inspection>> getInspectionsByTransformer(@PathVariable Long transformerId) {
        List<Inspection> inspections = inspectionService.getInspectionsByTransformer(transformerId);
        return ResponseEntity.ok(inspections);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        try {
            System.out.println("Calling deleteById for ID: " + id);
            inspectionService.deleteInspection(id);
            System.out.println("Delete executed.");
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            // Log the exception to the console for debugging
            e.printStackTrace();
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<InspectionDTO> getInspectionById(@PathVariable Long id) {
        return inspectionService.findInspectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
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

    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable Long id, @RequestBody Inspection updatedInspection) {
        try {
            Inspection savedInspection = inspectionService.updateInspection(id, updatedInspection);
            return ResponseEntity.ok(savedInspection);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Autowired
    private AnomalyDetectionService anomalyDetectionService; // Ensure this is injected

    // 1. API to trigger detection (POST)
    @PostMapping("/{inspectionId}/detect-anomalies")
    public ResponseEntity<AnomalyDetectionResult> detectAnomalies(@PathVariable Long inspectionId, @RequestBody DetectionRequest request) {
        try {
            AnomalyDetectionResult result = anomalyDetectionService.runDetection(inspectionId, request.getBaselineFileName(), request.getTempThresholdPercentage());
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            // RuntimeException is used for known errors (e.g., Image not found, script failed)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 2. API to fetch the textual anomaly results (GET)
    @GetMapping("/{inspectionId}/anomalies")
    public ResponseEntity<AnomalyDetectionResult> getAnomalyResultByInspectionId(@PathVariable Long inspectionId) {
        return anomalyDetectionService.getDetectionResultByInspectionId(inspectionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }


//    @GetMapping("/api/inspections/{inspectionId}/anomalies")
//    public ResponseEntity<AnomalyDetectionResult> getAnomalyResultByInspectionId(@PathVariable Long inspectionId) {
//        // Logic to find the AnomalyDetectionResult by inspectionId
//        Optional<AnomalyDetectionResult> result = anomalyDetectionService.getDetectionResultByInspectionId(inspectionId);
//        if (result.isEmpty()) {
//            return ResponseEntity.notFound().build(); // This is the 404 you were seeing
//        }
//        return ResponseEntity.ok(result);
//    }

    // 3. API to fetch the annotated image (GET)
    @GetMapping("/{inspectionId}/anomalies/image")
    public ResponseEntity<Resource> viewAnnotatedAnomalyImage(@PathVariable Long inspectionId) {
        try {
            Resource file = anomalyDetectionService.loadAnnotatedImageAsResource(inspectionId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_JPEG) // Change if your Python outputs PNG
                    .body(file);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}