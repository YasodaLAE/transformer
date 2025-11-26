package com.university.transformer.oversight.service.impl;

import com.university.transformer.oversight.dto.MaintenanceRecordDTO;
import com.university.transformer.oversight.model.Inspection;
import com.university.transformer.oversight.model.MaintenanceRecord;
import com.university.transformer.oversight.repository.InspectionRepository;
import com.university.transformer.oversight.repository.MaintenanceRecordRepository;
import com.university.transformer.oversight.service.MaintenanceRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class MaintenanceRecordServiceImpl implements MaintenanceRecordService {

    @Autowired private InspectionRepository inspectionRepository;
    @Autowired private MaintenanceRecordRepository recordRepository;

    @Override
    @Transactional(readOnly = true)
    public MaintenanceRecordDTO getRecordForInspection(Long inspectionId) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionId));

        Optional<MaintenanceRecord> existingRecord = recordRepository.findByInspectionId(inspectionId);
        return new MaintenanceRecordDTO(existingRecord.orElse(null), inspection);
    }

    @Override
    @Transactional
    public MaintenanceRecordDTO saveRecord(Long inspectionId, MaintenanceRecordDTO dto) {
        Inspection inspection = inspectionRepository.findById(inspectionId)
                .orElseThrow(() -> new RuntimeException("Inspection not found: " + inspectionId));

        MaintenanceRecord record = recordRepository.findByInspectionId(inspectionId)
                .orElse(new MaintenanceRecord());

        record.setInspection(inspection);

        // Map Simplified Fields
        record.setJobStartedTime(dto.getJobStartedTime());
        record.setJobCompletedTime(dto.getJobCompletedTime());

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
        return new MaintenanceRecordDTO(savedRecord, inspection);
    }
}