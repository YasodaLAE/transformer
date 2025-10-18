package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.AnnotationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnotationLogRepository extends JpaRepository<AnnotationLog, Long> {
    // We can add methods to find logs by inspection ID later if needed.
    List<AnnotationLog> findByInspectionIdOrderByTimestampDesc(Long inspectionId);
}