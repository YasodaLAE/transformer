package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnnotationRepository extends JpaRepository<Annotation, Long> {
    List<Annotation> findByInspectionId(Long inspectionId);
    List<Annotation> findByInspectionIdAndIsDeletedFalse(Long inspectionId);
    void deleteByInspectionId(Long inspectionId);
}