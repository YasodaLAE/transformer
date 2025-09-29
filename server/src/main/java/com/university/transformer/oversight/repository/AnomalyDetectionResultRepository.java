package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.AnomalyDetectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnomalyDetectionResultRepository extends JpaRepository<AnomalyDetectionResult, Long> {
    // Look up the detection result by the parent inspection ID
    Optional<AnomalyDetectionResult> findByInspectionId(Long inspectionId);
}