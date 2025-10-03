package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.AnomalyDetectionResult;
import org.springframework.core.io.Resource;
import java.util.Optional;

public interface AnomalyDetectionService {
    // 1. Core method to run the python detection script
    //AnomalyDetectionResult runDetection(Long inspectionId) throws Exception;
    AnomalyDetectionResult runDetection(Long inspectionId, String baselineFileName, Double tempThresholdPercentage) throws Exception;

    // 2. Method to fetch the stored anomaly results
    Optional<AnomalyDetectionResult> getDetectionResultByInspectionId(Long inspectionId);

    // 3. Method to serve the image with bounding boxes
    Resource loadAnnotatedImageAsResource(Long inspectionId);


}