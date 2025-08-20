package com.university.transformer.oversight.service;

import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.repository.InspectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import com.university.transformer.oversight.dto.InspectionDTO;
@Service
public class InspectionService {

    @Autowired
    private InspectionRepository inspectionRepository;

    public List<Inspection> getInspectionsByTransformer(Long transformerId) {
        return inspectionRepository.findByTransformerId(transformerId);
    }

    public Inspection saveInspection(Inspection inspection) {
        return inspectionRepository.save(inspection);
    }

    public void deleteInspection(Long id) {
        inspectionRepository.deleteById(id);
    }
    public Optional<InspectionDTO> findInspectionById(Long id) {
        // Find the entity, then convert it to a DTO
        return inspectionRepository.findById(id).map(InspectionDTO::new);
    }
    }
