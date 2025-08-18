package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Inspection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InspectionRepository extends JpaRepository<Inspection, Long> {
    List<Inspection> findByTransformerId(Long transformerId);
}
