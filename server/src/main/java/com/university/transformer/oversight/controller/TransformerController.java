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

/**
 * REST Controller for managing Transformer entities and their associated Baseline images.
 * Handles standard CRUD operations and file upload/retrieval specific to Transformers.
 */
@RestController
@RequestMapping("/api/transformers")
@CrossOrigin(origins = "http://localhost:5173") // Allows requests from the React frontend
public class TransformerController {

    @Autowired
    private TransformerService transformerService;

    // POST: Create a new transformer record
    @PostMapping
    public ResponseEntity<Transformer> createTransformer(@RequestBody Transformer transformer) {
        Transformer savedTransformer = transformerService.saveTransformer(transformer);
        return new ResponseEntity<>(savedTransformer, HttpStatus.CREATED);
    }

    // GET: Retrieve all transformer records (used for the list page)
    @GetMapping
    public List<Transformer> getAllTransformers() {
        return transformerService.findAllTransformers();
    }

    // GET: Retrieve a single transformer by ID (used for details/context)
    @GetMapping("/{id}")
    public ResponseEntity<Transformer> getTransformerById(@PathVariable Long id) {
        return transformerService.findTransformerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // PUT: Update an existing transformer record
    @PutMapping("/{id}")
    public ResponseEntity<Transformer> updateTransformer(@PathVariable Long id, @RequestBody Transformer transformerDetails) {
        try {
            Transformer updatedTransformer = transformerService.updateTransformer(id, transformerDetails);
            return ResponseEntity.ok(updatedTransformer);
        } catch (RuntimeException e) {
            // Returns 404 if transformer not found
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE: Delete a transformer record
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransformer(@PathVariable Long id) {
        try {
            transformerService.deleteTransformer(id);
            return ResponseEntity.noContent().build(); // 204 No Content
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // -------------------------------------------------------------------
    // --- Baseline Image Endpoints ---
    // -------------------------------------------------------------------

    // POST: Upload the baseline image file and metadata for a transformer
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

    // GET: Serve the baseline image file as a resource for the browser/frontend
    @GetMapping("/{transformerId}/baseline-image/view")
    public ResponseEntity<Resource> viewBaselineImage(@PathVariable Long transformerId) {
        try {
            Resource file = transformerService.loadBaselineImageAsResource(transformerId);
            return ResponseEntity.ok()
                    // Forces the browser to display the image inline
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + file.getFilename() + "\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(file);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE: Remove the baseline image file and clear its database reference
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