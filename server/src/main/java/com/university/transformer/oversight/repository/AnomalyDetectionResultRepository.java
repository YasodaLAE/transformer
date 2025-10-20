package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.AnomalyDetectionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AnomalyDetectionResultRepository extends JpaRepository<AnomalyDetectionResult, Long> {
    Optional<AnomalyDetectionResult> findByInspectionId(Long inspectionId);
}