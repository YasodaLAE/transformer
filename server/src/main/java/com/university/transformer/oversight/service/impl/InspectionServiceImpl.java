package com.university.transformer.oversight.service.impl;
import com.university.transformer.oversight.dto.InspectionDTO;


import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.TransformerRepository;
import com.university.transformer.oversight.service.InspectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InspectionServiceImpl extends InspectionService {

    private final InspectionRepository inspectionRepository;
    private final TransformerRepository transformerRepository;

    @Autowired
    public InspectionServiceImpl(InspectionRepository inspectionRepository, TransformerRepository transformerRepository) {
        this.inspectionRepository = inspectionRepository;
        this.transformerRepository = transformerRepository;
    }

    @Override
    public List<Inspection> getInspectionsByTransformer(Long transformerId) {
        // You can add logic here to handle cases where the transformerId doesn't exist
        return inspectionRepository.findByTransformerId(transformerId);
    }


    public Inspection saveInspection(Inspection inspection) {
        // Find the transformer to associate with the inspection
        Transformer transformer = transformerRepository.findById(inspection.getTransformer().getId())
                .orElseThrow(() -> new RuntimeException("Transformer not found"));
        inspection.setTransformer(transformer); // Ensure the association is correctly set
        return inspectionRepository.save(inspection);
    }


    @Override
    public Optional<InspectionDTO> findInspectionById(Long id) {
        return inspectionRepository.findById(id)
                .map(InspectionDTO::new); // Find the entity, then map it to a new DTO
    }


    public void deleteInspection(Long id) {
        if (!inspectionRepository.existsById(id)) {
            throw new RuntimeException("Inspection not found with id: " + id);
        }
        inspectionRepository.deleteById(id);
    }
}