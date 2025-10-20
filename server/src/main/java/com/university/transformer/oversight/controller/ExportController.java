package com.university.transformer.oversight.controller;

import com.university.transformer.oversight.dto.AnnotationExportDTO;
import com.university.transformer.oversight.service.FeedbackExportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private FeedbackExportService exportService;

    @GetMapping(value = "/inspection/{inspectionId}/feedback-log", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<AnnotationExportDTO>> exportFeedbackJson(@PathVariable Long inspectionId) {
        List<AnnotationExportDTO> logData = exportService.getFeedbackLog(inspectionId);

        // Tells the browser to download the file instead of displaying it inline
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"feedback_log_inspection_" + inspectionId + ".json\"")
                .body(logData);
    }
}