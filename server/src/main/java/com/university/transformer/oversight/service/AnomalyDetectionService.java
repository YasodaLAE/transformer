package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.AnomalyDetectionResult;
import org.springframework.core.io.Resource;
import java.io.IOException;
import java.util.Optional;

public interface AnomalyDetectionService {
    // Core method to run the python detection script
    AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception;

    // Method to fetch the stored anomaly results
    Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId);

    // Method to serve the image with AI-generated bounding boxes
    Resource loadAnnotatedImageAsResource(Long inspectionId);

    //To serve an image with user-saved bounding boxes
    Resource drawUserAnnotationsOnImage(Long inspectionId) throws IOException;
}