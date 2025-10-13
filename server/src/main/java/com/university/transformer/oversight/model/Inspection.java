package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "inspection")
@Data
@NoArgsConstructor
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String inspectionNo;
    private LocalDateTime inspectedDate;
    private LocalDateTime maintenanceDate;
    private String status;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @JsonProperty("inspectedBy")
    private String inspectedBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id")
    @JsonBackReference
    private Transformer transformer;

    @OneToOne(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private ThermalImage thermalImage;

    /**
     * Ensures inspectedBy is not set to null or blank values.
     */
    public void setInspectedBy(String inspectedBy) {
        if (inspectedBy != null && !inspectedBy.trim().isEmpty()) {
            this.inspectedBy = inspectedBy;
        } else {
            System.out.println("Warning: Received a null or empty value for inspectedBy.");
        }
    }

    // Explicit getter/setter for 'notes' to ensure stability in some build environments
    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
