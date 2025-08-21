package com.university.transformer.oversight.service;

import com.university.transformer.oversight.dto.InspectionDTO;
import com.university.transformer.oversight.model.Inspection;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.Optional;

public interface InspectionService {
    List<Inspection> getInspectionsByTransformer(Long transformerId);
    Inspection saveInspection(Inspection inspection);
    void deleteInspection(Long id);
    Optional<InspectionDTO> findInspectionById(Long id);

    // Methods for thermal images now live here
    void addThermalImageToInspection(Long inspectionId, MultipartFile file, String condition, String uploader) throws Exception;
    void deleteThermalImage(Long imageId);

}