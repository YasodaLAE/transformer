package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.university.transformer.oversight.dto.AnnotationExportDTO;
import org.springframework.data.jpa.repository.Query;

public interface AnnotationRepository extends JpaRepository<Annotation, Long> {
    List<Annotation> findByInspectionId(Long inspectionId);
    List<Annotation> findByInspectionIdAndIsDeletedFalse(Long inspectionId);

    void deleteByInspectionId(Long inspectionId);

    @Query("SELECT new com.university.transformer.oversight.dto.AnnotationExportDTO(" +
            // Inspection/Context Data
            "i.id, i.inspectionNo, ti.fileName, " +
            // Final User Annotation State & Coordinates
            "a.id, a.currentStatus, a.faultType, a.comments, " +
            "a.x, a.y, a.width, a.height, " +
            // Annotator Metadata
            "a.userId, a.timestamp, " +
            // Original AI Data
            "a.originalSource, a.aiConfidence, a.aiSeverityScore) " +
            // Join relationships:
            "FROM Annotation a " +
            "JOIN a.inspection i " + // Join from Annotation to Inspection (i)
            "LEFT JOIN i.thermalImage ti " + // Join from Inspection (i) to ThermalImage (ti)
            "ORDER BY i.id, a.id")
    List<AnnotationExportDTO> findAllAnnotationsForExport();
}