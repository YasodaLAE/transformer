package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inspections")
public class InspectionController {

    @Autowired
    private InspectionService inspectionService;

    @GetMapping("/by-transformer/{transformerId}")
    public List<Inspection> getInspectionsByTransformer(@PathVariable Long transformerId) {
        return inspectionService.getInspectionsByTransformer(transformerId);
    }

    @PostMapping
    public Inspection createInspection(@RequestBody Inspection inspection) {
        return inspectionService.saveInspection(inspection);
    }

    // You'll also need a PUT/PATCH endpoint for editing and a DELETE endpoint for deleting
}