package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.ThermalImage.EnvironmentalCondition;
import org.springframework.web.multipart.MultipartFile;

public interface ThermalImageService {
    void saveThermalImage(String transformerId, MultipartFile file, EnvironmentalCondition condition, String uploader) throws Exception;
    void deleteThermalImage(Long imageId);
}