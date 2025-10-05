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
import com.university.transformer.oversight.dto.DetectionRequest; // DTO for receiving detection parameters
import java.util.Optional;

import com.university.transformer.oversight.service.AnomalyDetectionService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/**
 * REST Controller managing all Inspection-related endpoints, including CRUD,
 * file uploads, and anomaly detection triggers.
 */
@RestController
@RequestMapping("/api/inspections")
// NOTE: @CrossOrigin should be present here or globally configured for front-end access
public class InspectionController {
    @Autowired
    private InspectionService inspectionService;

    @Autowired
    private AnomalyDetectionService anomalyDetectionService;

    // GET: Retrieve all inspections (used on the All Inspections Page)
    @GetMapping
    public ResponseEntity<List<InspectionDTO>> getAllInspections() {
        List<InspectionDTO> inspections = inspectionService.getAllInspections();
        return ResponseEntity.ok(inspections);
    }

    // POST: Create a new inspection record
    @PostMapping
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        System.out.println("Received raw JSON payload: " + inspection.toString());
        Inspection newInspection = inspectionService.saveInspection(inspection);
        return new ResponseEntity<>(newInspection, HttpStatus.CREATED);
    }

    // GET: Retrieve all inspections associated with a specific transformer
    @GetMapping("/by-transformer/{transformerId}")
    public ResponseEntity<List<Inspection>> getInspectionsByTransformer(@PathVariable Long transformerId) {
        List<Inspection> inspections = inspectionService.getInspectionsByTransformer(transformerId);
        return ResponseEntity.ok(inspections);
    }

    // GET: Retrieve a single inspection by its ID (used on the Detail Page)
    @GetMapping("/{id}")
    public ResponseEntity<InspectionDTO> getInspectionById(@PathVariable Long id) {
        return inspectionService.findInspectionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT: Update an existing inspection record (used for Notes and general details)
    @PutMapping("/{id}")
    public ResponseEntity<Inspection> updateInspection(@PathVariable Long id, @RequestBody Inspection updatedInspection) {
        try {
            Inspection savedInspection = inspectionService.updateInspection(id, updatedInspection);
            return ResponseEntity.ok(savedInspection);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE: Delete a single inspection record
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInspection(@PathVariable Long id) {
        try {
            System.out.println("Calling deleteById for ID: " + id);
            inspectionService.deleteInspection(id);
            System.out.println("Delete executed.");
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            e.printStackTrace();
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // --- File and Anomaly Detection Endpoints ---

    // POST: Upload the maintenance thermal image and its metadata
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

    // DELETE: Delete a specific thermal image record
    @DeleteMapping("/thermal-image/{imageId}")
    public ResponseEntity<Void> deleteThermalImage(@PathVariable Long imageId) {
        try {
            inspectionService.deleteThermalImage(imageId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // 1. POST: API to trigger detection with dynamic parameters (Baseline name, Threshold)
    @PostMapping("/{inspectionId}/detect-anomalies")
    public ResponseEntity<AnomalyDetectionResult> detectAnomalies(@PathVariable Long inspectionId, @RequestBody DetectionRequest request) {
        try {
            // Call service method, passing necessary parameters from the request body DTO
            AnomalyDetectionResult result = anomalyDetectionService.runDetection(
                    inspectionId,
                    request.getBaselineFileName(),
                    request.getTempThresholdPercentage()
            );
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            // Returns 400 Bad Request if image is missing or script fails
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // 2. GET: API to fetch the textual anomaly results (JSON/metadata)
    @GetMapping("/{inspectionId}/anomalies")
    public ResponseEntity<AnomalyDetectionResult> getAnomalyResultByInspectionId(@PathVariable Long inspectionId) {
        return anomalyDetectionService.getDetectionResultByInspectionId(inspectionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 3. GET: API to fetch the annotated image file for display
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
}