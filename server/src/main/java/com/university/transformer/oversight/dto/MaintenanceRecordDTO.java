package com.university.transformer.oversight.dto;

import com.university.transformer.oversight.model.MaintenanceRecord;
import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.model.Inspection;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime; // <-- Updated import to include Time
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class MaintenanceRecordDTO {

    private Long id;
    private Long inspectionId;
    private String inspectionNo;

    // --- Read-Only Context (Enhanced) ---
    private String transformerId;
    private String region;
    private String location;
    private String capacity;
    private String poleId;
    private String transformerType;
    private String noOfFeeders;

    // --- Updated to LocalDateTime to include Time ---
    private LocalDateTime inspectionDate;
    private LocalDateTime maintenanceDate;
    // -----------------------------------------------

    private String inspectionStatus;

    private String thermalImageFileName;

    // New Engineer Info
    private String inspectorName;
    private LocalDate inspectionEngineerDate;
    private LocalTime inspectionEngineerTime;

    // --- Editable Fields ---
    private String voltageL1;
    private String voltageL2;
    private String voltageL3;

    private String currentL1;
    private String currentL2;
    private String currentL3;

    private String oilLevel;
    private String oilTemperature;

    private String transformerStatus;
    private String recommendedAction;
    private String correctiveAction;
    private String comments;

    public MaintenanceRecordDTO(MaintenanceRecord record, Inspection inspection) {
        this.inspectionId = inspection.getId();
        this.inspectionNo = inspection.getInspectionNo();

        // Populate Read-Only Data from Transformer
        if (inspection.getTransformer() != null) {
            Transformer t = inspection.getTransformer();
            this.transformerId = t.getTransformerId();
            this.region = t.getRegion();
            this.location = t.getDetails();
            this.capacity = t.getCapacity();
            this.poleId = t.getPoleId();
            this.transformerType = t.getTransformerType();
            this.noOfFeeders = t.getNoOfFeeders();
        }

        // Populate Read-Only Data from Inspection
        // We now assign the full LocalDateTime object directly
        this.inspectionDate = inspection.getInspectedDate();
        this.maintenanceDate = inspection.getMaintenanceDate();
        this.inspectionStatus = inspection.getStatus();

        if (inspection.getThermalImage() != null) {
            this.thermalImageFileName = inspection.getThermalImage().getFileName();
        }

        // Populate Editable Data
        if (record != null) {
            this.id = record.getId();

            // Map New Fields
            this.inspectorName = record.getInspectorName();
            this.inspectionEngineerDate = record.getInspectionEngineerDate();
            this.inspectionEngineerTime = record.getInspectionEngineerTime();
            this.correctiveAction = record.getCorrectiveAction();
            this.voltageL1 = record.getVoltageL1();
            this.voltageL2 = record.getVoltageL2();
            this.voltageL3 = record.getVoltageL3();

            this.currentL1 = record.getCurrentL1();
            this.currentL2 = record.getCurrentL2();
            this.currentL3 = record.getCurrentL3();

            this.oilLevel = record.getOilLevel();
            this.oilTemperature = record.getOilTemperature();

            this.transformerStatus = record.getTransformerStatus();
            this.recommendedAction = record.getRecommendedAction();
            this.comments = record.getComments();
        }
    }
}