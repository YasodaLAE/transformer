package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import com.university.transformer.oversight.model.Annotation;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.MaintenanceRecord;
import com.university.transformer.oversight.repository.AnnotationRepository;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.MaintenanceRecordRepository;
import com.university.transformer.oversight.service.MaintenanceRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MaintenanceRecordServiceImpl implements MaintenanceRecordService {

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private MaintenanceRecordRepository recordRepository;
    @Autowired private AnnotationRepository annotationRepository;

    // Helper method to populate anomalies
    private void populateAnomalyDetails(MaintenanceRecordDTO dto, Long inspectionId) {
        List<Annotation> annotations = annotationRepository.findByInspectionIdAndIsDeletedFalse(inspectionId);
        List<MaintenanceRecordDTO.AnomalySimpleDTO> anomalyDTOs = annotations.stream().map(a -> {
            MaintenanceRecordDTO.AnomalySimpleDTO ad = new MaintenanceRecordDTO.AnomalySimpleDTO();
            ad.setType(a.getFaultType());
            ad.setConfidence(a.getAiConfidence());
            ad.setSeverity(a.getAiSeverityScore());
            ad.setSource(a.getOriginalSource());
            // --- Map New Fields ---
            ad.setUserId(a.getUserId());
            ad.setCurrentStatus(a.getCurrentStatus());
            // ---------------------

            return ad;
        }).collect(Collectors.toList());

        dto.setAnomalyDetails(anomalyDTOs);
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceRecordDTO getRecordForInspection(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionId));

        Optional<MaintenanceRecord> existingRecord = recordRepository.findByInspectionId(inspectionId);
        MaintenanceRecordDTO dto = new MaintenanceRecordDTO(existingRecord.orElse(null), inspection);

        // Populate Anomalies
        populateAnomalyDetails(dto, inspectionId);

        return dto;
    }

    @Override
    @Transactional
    public MaintenanceRecordDTO saveRecord(Long inspectionId, MaintenanceRecordDTO dto) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionId));

        MaintenanceRecord record = recordRepository.findByInspectionId(inspectionId)
                .orElse(new MaintenanceRecord());

        record.setInspection(inspection);

        // --- Map New Fields ---
        record.setInspectorName(dto.getInspectorName());
        record.setInspectionEngineerDate(dto.getInspectionEngineerDate());
        record.setInspectionEngineerTime(dto.getInspectionEngineerTime());
        record.setCorrectiveAction(dto.getCorrectiveAction());

        // Map Simplified Fields (No Job Times)
        record.setVoltageL1(dto.getVoltageL1());
        record.setVoltageL2(dto.getVoltageL2());
        record.setVoltageL3(dto.getVoltageL3());

        record.setCurrentL1(dto.getCurrentL1());
        record.setCurrentL2(dto.getCurrentL2());
        record.setCurrentL3(dto.getCurrentL3());

        record.setOilLevel(dto.getOilLevel());
        record.setOilTemperature(dto.getOilTemperature());

        record.setTransformerStatus(dto.getTransformerStatus());
        record.setRecommendedAction(dto.getRecommendedAction());
        record.setComments(dto.getComments());

        MaintenanceRecord savedRecord = recordRepository.save(record);
        MaintenanceRecordDTO resultDto = new MaintenanceRecordDTO(savedRecord, inspection);

        // Populate Anomalies in return object as well
        populateAnomalyDetails(resultDto, inspectionId);

        return resultDto;
    }
}