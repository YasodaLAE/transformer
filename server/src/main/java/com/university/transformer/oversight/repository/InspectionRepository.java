package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InspectionRepository extends JpaRepository<Inspection, Long> {

    // This method name must match the field name in your Inspection entity
    List<Inspection> findByTransformerId(Long transformerId);
}