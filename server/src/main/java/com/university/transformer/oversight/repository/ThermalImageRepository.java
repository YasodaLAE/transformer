package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.ThermalImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ThermalImageRepository extends JpaRepository<ThermalImage, Long> {
    Optional<ThermalImage> findByInspectionId(Long inspectionId);
}