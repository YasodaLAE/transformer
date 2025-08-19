package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @PostMapping // This method handles the POST request
    public ResponseEntity<Inspection> createInspection(@RequestBody Inspection inspection) {
        Inspection newInspection = inspectionService.saveInspection(inspection);
        return new ResponseEntity<>(newInspection, HttpStatus.CREATED);
    }

    @GetMapping("/by-transformer/{transformerId}")
    public ResponseEntity<List<Inspection>> getInspectionsByTransformer(@PathVariable Long transformerId) {
        List<Inspection> inspections = inspectionService.getInspectionsByTransformer(transformerId);
        return ResponseEntity.ok(inspections);
    }
}