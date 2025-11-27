package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import com.university.transformer.oversight.service.MaintenanceRecordService;
import com.university.transformer.oversight.service.PdfGenerationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = "http://localhost:5173")
public class MaintenanceRecordController {

    @Autowired private MaintenanceRecordService recordService;
    @Autowired private PdfGenerationService pdfService;

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

    @GetMapping("/{inspectionId}/maintenance-record/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long inspectionId) {
        try {
            // 1. Get the data
            MaintenanceRecordDTO record = recordService.getRecordForInspection(inspectionId);

            // 2. Generate the PDF
            byte[] pdfBytes = pdfService.generateMaintenancePdf(record);

            // 3. Return as file download
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=maintenance_record_" + inspectionId + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}