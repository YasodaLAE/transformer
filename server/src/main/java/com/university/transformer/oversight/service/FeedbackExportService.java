// src/main/java/com/university/transformer/oversight/service/FeedbackExportService.java

package com.university.transformer.oversight.service;

import com.university.transformer.oversight.dto.AnnotationExportDTO;
import java.util.List;

public interface FeedbackExportService {

    // Defines the contract for fetching the structured feedback data
    List<AnnotationExportDTO> getFeedbackLog(Long inspectionId);
}