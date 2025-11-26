package com.university.transformer.oversight.dto;

import com.university.transformer.oversight.model.MaintenanceRecord;
import com.university.transformer.oversight.model.Transformer;
import com.university.transformer.oversight.model.Inspection;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
public class MaintenanceRecordDTO {

    private Long id;
    private Long inspectionId;

    // Read-Only Context
    private String transformerId;
    private String region;
    private String location;
    private String capacity;
    private String poleId;
    private LocalDate inspectionDate;

    // --- NEW FIELD ---
    private String thermalImageFileName;
    // -----------------

    // Editable Fields
    private LocalTime jobStartedTime;
    private LocalTime jobCompletedTime;

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
    private String comments;

    public MaintenanceRecordDTO(MaintenanceRecord record, Inspection inspection) {
        this.inspectionId = inspection.getId();

        if (inspection.getTransformer() != null) {
            Transformer t = inspection.getTransformer();
            this.transformerId = t.getTransformerId();
            this.region = t.getRegion();
            this.location = t.getDetails();
            this.capacity = t.getCapacity();
            this.poleId = t.getPoleId();
        }

        this.inspectionDate = inspection.getInspectedDate() != null
                ? inspection.getInspectedDate().toLocalDate()
                : null;

        // --- NEW LOGIC: Get the image filename ---
        if (inspection.getThermalImage() != null) {
            this.thermalImageFileName = inspection.getThermalImage().getFileName();
        }

        if (record != null) {
            this.id = record.getId();
            this.jobStartedTime = record.getJobStartedTime();
            this.jobCompletedTime = record.getJobCompletedTime();

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