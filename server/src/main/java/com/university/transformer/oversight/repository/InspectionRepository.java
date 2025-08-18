package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Inspection;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByTransformerId(Long transformerId);
}
