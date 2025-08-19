package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.model.ThermalImage.ImageType;
import com.university.transformer.oversight.model.ThermalImage.EnvironmentalCondition;
import com.university.transformer.oversight.service.TransformerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "http://localhost:5173") // Allow requests from the React dev server
public class TransformerController {

    @Autowired
    private TransformerService transformerService;

    // FR1.1: Add new transformer records
    @PostMapping
    public ResponseEntity<Transformer> createTransformer(@RequestBody Transformer transformer) {
        Transformer savedTransformer = transformerService.saveTransformer(transformer);
        return new ResponseEntity<>(savedTransformer, HttpStatus.CREATED);
    }

    // FR1.1: View existing transformer records (all)
    @GetMapping
    public List<Transformer> getAllTransformers() {
        return transformerService.findAllTransformers();
    }

    // FR1.1: View existing transformer records (by ID)
    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable Long id) {
        return transformerService.findTransformerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // FR1.1: Edit existing transformer records
    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable Long id, @RequestBody Transformer transformerDetails) {
        try {
            Transformer updatedTransformer = transformerService.updateTransformer(id, transformerDetails);
            return ResponseEntity.ok(updatedTransformer);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{transformerId}/baseline-image/view")
    public ResponseEntity<Resource> viewBaselineImage(@PathVariable Long transformerId) {
        try {
            Resource file = transformerService.loadBaselineImageAsResource(transformerId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_PNG) // Adjust content type as needed
                    .body(file);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{transformerId}/baseline-image")
    public ResponseEntity<Void> deleteBaselineImage(@PathVariable Long transformerId) {
        try {
            transformerService.deleteBaselineImage(transformerId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // FR1.1: Delete transformer entries
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable Long id) {
        try {
            transformerService.deleteTransformer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/baseline-image")
    public ResponseEntity<String> uploadBaselineImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("condition") String condition,
            @RequestParam("uploader") String uploader) {
        try {
            transformerService.saveBaselineImage(id, file, condition, uploader);
            return ResponseEntity.status(HttpStatus.CREATED).body("Baseline image uploaded successfully for transformer: " + id);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not upload the file: " + e.getMessage());
        }
    }

    // FR1.2 & FR1.3: Upload thermal image with tagging
    @PostMapping("/{transformerId}/images")
    public ResponseEntity<String> uploadImage(
            @PathVariable String transformerId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("imageType") ImageType imageType,
            @RequestParam("condition") EnvironmentalCondition condition) {
        try {
            // In a real app, uploaderId would come from security context
            String uploaderId = "admin";
            transformerService.addImageToTransformer(transformerId, file, imageType, condition, uploaderId);
            return ResponseEntity.status(HttpStatus.CREATED).body("File uploaded successfully for transformer: " + transformerId);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not upload the file: " + e.getMessage());
        }
    }
}
