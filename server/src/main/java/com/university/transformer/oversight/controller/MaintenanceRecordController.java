package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import com.university.transformer.oversight.service.MaintenanceRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceRecordController {

    @Autowired private MaintenanceRecordService recordService;

    @GetMapping("/{inspectionId}/maintenance-record")
    public ResponseEntity<MaintenanceRecordDTO> getRecord(@PathVariable Long inspectionId) {
        return ResponseEntity.ok(recordService.getRecordForInspection(inspectionId));
    }

    @PostMapping("/{inspectionId}/maintenance-record")
    public ResponseEntity<MaintenanceRecordDTO> saveRecord(
            @PathVariable Long inspectionId,
            @RequestBody MaintenanceRecordDTO recordDTO) {
        return ResponseEntity.ok(recordService.saveRecord(inspectionId, recordDTO));
    }
}