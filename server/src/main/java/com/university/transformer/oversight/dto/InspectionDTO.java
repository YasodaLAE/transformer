package com.university.transformer.oversight.dto;

import com.university.transformer.oversight.model.Inspection;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Data Transfer Object (DTO) used to safely expose Inspection data to the frontend.
 * It combines essential fields from the Inspection and related Transformer entities
 * while simplifying complex JPA relationships.
 */
@Data
public class InspectionDTO {

    // --- Inspection Details ---
    private Long id;
    private String inspectionNo;
    private LocalDateTime inspectedDate;
    private LocalDateTime maintenanceDate;
    private String status;
    private String inspectedBy;

    private String notes;

    // --- Transformer Summary Fields (Flattened for UI convenience) ---
    private Long transformerDbId;
    private String region;
    private String poleId;
    private String transformerType;
    private String details;
    private String transformerBaselineImageName;
    private String transformerId;

    // --- Related Entities ---
    // The single thermal image linked to this inspection
    private ThermalImageDTO thermalImage;

    /**
     * Constructor maps data from the JPA entity (Inspection) to the DTO.
     */
    public InspectionDTO(Inspection inspection) {
        // Copy direct Inspection fields
        this.id = inspection.getId();
        this.inspectionNo = inspection.getInspectionNo();
        this.inspectedDate = inspection.getInspectedDate();
        this.maintenanceDate = inspection.getMaintenanceDate();
        this.status = inspection.getStatus();
        this.inspectedBy = inspection.getInspectedBy();
        this.notes = inspection.getNotes();

        // Flatten Transformer details if the relationship exists
        if (inspection.getTransformer() != null) {
            this.transformerDbId = inspection.getTransformer().getId();
            this.transformerId = inspection.getTransformer().getTransformerId();
            this.region = inspection.getTransformer().getRegion();
            this.poleId = inspection.getTransformer().getPoleId();
            this.transformerType = inspection.getTransformer().getTransformerType();
            this.details = inspection.getTransformer().getDetails();
            this.transformerBaselineImageName = inspection.getTransformer().getBaselineImageName();
        }

        // Map the associated ThermalImage entity to its corresponding DTO
        if (inspection.getThermalImage() != null) {
            this.thermalImage = new ThermalImageDTO(inspection.getThermalImage());
        }
    }
}