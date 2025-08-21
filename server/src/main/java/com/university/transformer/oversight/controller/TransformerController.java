package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.service.TransformerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "http://localhost:5173")
public class TransformerController {

    @Autowired
    private TransformerService transformerService;

    @PostMapping
    public ResponseEntity<Transformer> createTransformer(@RequestBody Transformer transformer) {
        Transformer savedTransformer = transformerService.saveTransformer(transformer);
        return new ResponseEntity<>(savedTransformer, HttpStatus.CREATED);
    }

    @GetMapping
    public List<Transformer> getAllTransformers() {
        return transformerService.findAllTransformers();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable Long id) {
        return transformerService.findTransformerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable Long id, @RequestBody Transformer transformerDetails) {
        try {
            Transformer updatedTransformer = transformerService.updateTransformer(id, transformerDetails);
            return ResponseEntity.ok(updatedTransformer);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable Long id) {
        try {
            transformerService.deleteTransformer(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // --- All Baseline Image methods are still here ---

    @PostMapping("/{id}/baseline-image")
    public ResponseEntity<String> uploadBaselineImage(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("condition") String condition,
            @RequestParam("uploader") String uploader) {
        try {
            transformerService.saveBaselineImage(id, file, condition, uploader);
            return ResponseEntity.status(HttpStatus.CREATED).body("Baseline image uploaded successfully for transformer: " + id);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Could not upload the file: " + e.getMessage());
        }
    }

    @GetMapping("/{transformerId}/baseline-image/view")
    public ResponseEntity<Resource> viewBaselineImage(@PathVariable Long transformerId) {
        try {
            Resource file = transformerService.loadBaselineImageAsResource(transformerId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
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
}