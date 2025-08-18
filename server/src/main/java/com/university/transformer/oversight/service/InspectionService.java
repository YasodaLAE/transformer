package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.Inspection;
import java.util.List;
import java.util.Optional;

public interface InspectionService {

    List<Inspection> getInspectionsByTransformer(Long transformerId);
    Inspection saveInspection(Inspection inspection);

    Optional<Inspection> findInspectionById(Long id);

    //Optional<Inspection> findInspectionById(Long id);
    void deleteInspection(Long id);

    // You can add more methods here for updating inspections if needed
}
