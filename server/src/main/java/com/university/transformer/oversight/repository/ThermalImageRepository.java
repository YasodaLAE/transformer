package com.university.transformer.oversight.repository;

import com.university.transformer.oversight.model.ThermalImage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThermalImageRepository extends JpaRepository<ThermalImage, Long> {
}