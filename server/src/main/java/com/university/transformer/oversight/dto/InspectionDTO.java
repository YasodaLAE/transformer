// Create new package: com.university.transformer.oversight.dto
// Create new file: src/main/java/.../dto/InspectionDTO.java

package com.university.transformer.oversight.dto;
import java.util.List;
import java.util.stream.Collectors;

import com.university.transformer.oversight.model.Inspection;
import lombok.Data;

import java.time.LocalDate;

@Data
public class InspectionDTO {
    // Fields from Inspection
    private Long id;
    private String inspectionNo;
    private LocalDate inspectedDate;
    private LocalDate maintenanceDate;
    private String status;

    // Fields from the related Transformer
    private Long transformerDbId; // The numeric ID (e.g., 5)
    private String transformerBusinessId; // The business ID (e.g., "AX-8993")
    private String region;
    private String poleId;
    private String transformerType;
    private String details;

    private List<ThermalImageDTO> thermalImages;
    private String transformerBaselineImageName;

    // Constructor to convert an Entity to a DTO
    public InspectionDTO(Inspection inspection) {
        this.id = inspection.getId();
        this.inspectionNo = inspection.getInspectionNo();
        this.inspectedDate = inspection.getInspectedDate();
        this.maintenanceDate = inspection.getMaintenanceDate();
        this.status = inspection.getStatus();

        if (inspection.getTransformer() != null) {
            this.transformerDbId = inspection.getTransformer().getId();
            this.transformerBusinessId = inspection.getTransformer().getTransformerId();
            this.region = inspection.getTransformer().getRegion();
            this.poleId = inspection.getTransformer().getPoleId();
            this.transformerType = inspection.getTransformer().getTransformerType();
            this.details = inspection.getTransformer().getDetails();
        }
        // Add this logic to convert the list of entities to a list of DTOs
        if (inspection.getTransformer() != null && inspection.getTransformer().getThermalImages() != null) {
            this.thermalImages = inspection.getTransformer().getThermalImages().stream()
                    .map(ThermalImageDTO::new)
                    .collect(Collectors.toList());
            this.transformerBaselineImageName = inspection.getTransformer().getBaselineImageName();
        }
    }
}