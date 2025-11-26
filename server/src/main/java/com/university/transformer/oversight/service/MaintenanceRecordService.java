package com.university.transformer.oversight.service;

import com.university.transformer.oversight.dto.MaintenanceRecordDTO;

public interface MaintenanceRecordService {
    MaintenanceRecordDTO getRecordForInspection(Long inspectionId);
    MaintenanceRecordDTO saveRecord(Long inspectionId, MaintenanceRecordDTO dto);
}