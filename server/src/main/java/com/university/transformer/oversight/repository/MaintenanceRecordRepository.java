package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.MaintenanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MaintenanceRecordRepository extends JpaRepository<MaintenanceRecord, Long> {
    Optional<MaintenanceRecord> findByInspectionId(Long inspectionId);

    // MaintenanceRecordRepository.java (Verify this is exactly what you have)
    @Query("SELECT mr FROM MaintenanceRecord mr JOIN FETCH mr.inspection i JOIN FETCH i.transformer t WHERE t.id = :transformerId ORDER BY i.inspectedDate DESC")
    List<MaintenanceRecord> findByTransformerId(@Param("transformerId") Long transformerId);
}