package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {


    List<Inspection> findByTransformer_Id(Long transformerId);
    @Query("SELECT i FROM Inspection i JOIN FETCH i.transformer")
    List<Inspection> findAllWithTransformers();
    @Modifying
    @Query(value = "DELETE FROM thermal_image WHERE inspection_id = :inspectionId", nativeQuery = true)
    void deleteThermalImageByInspectionId(@Param("inspectionId") Long inspectionId);

    @Modifying
    @Query(value = "DELETE FROM inspection WHERE id = :inspectionId", nativeQuery = true)
    void deleteInspectionById(@Param("inspectionId") Long inspectionId);
}
