package com.university.transformer.oversight.dto;

import com.university.transformer.oversight.model.Inspection;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InspectionDTO {
    // Inspection fields
    private Long id;
    private String inspectionNo;
    private LocalDateTime inspectedDate; // Changed to LocalDateTime
    private LocalDateTime maintenanceDate;
    private String status;

    // Transformer fields
    private Long transformerDbId;
    private String region;
    private String poleId;
    private String transformerType;
    private String details;
    private String transformerBaselineImageName;
    private String transformerId;

    // The single thermal image for this inspection
    private ThermalImageDTO thermalImage;

    public InspectionDTO(Inspection inspection) {
        this.id = inspection.getId();
        this.inspectionNo = inspection.getInspectionNo();
        this.inspectedDate = inspection.getInspectedDate();
        this.maintenanceDate = inspection.getMaintenanceDate();
        this.status = inspection.getStatus();

        if (inspection.getTransformer() != null) {
            this.transformerDbId = inspection.getTransformer().getId();
            this.transformerId = inspection.getTransformer().getTransformerId();
            this.region = inspection.getTransformer().getRegion();
            this.poleId = inspection.getTransformer().getPoleId();
            this.transformerType = inspection.getTransformer().getTransformerType();
            this.details = inspection.getTransformer().getDetails();
            this.transformerBaselineImageName = inspection.getTransformer().getBaselineImageName();
        }

        // Use the new one-to-one relationship
        if (inspection.getThermalImage() != null) {
            this.thermalImage = new ThermalImageDTO(inspection.getThermalImage());
        }
    }
}