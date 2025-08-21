package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "inspection")
@Data
@NoArgsConstructor
public class Inspection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String inspectionNo;
    private LocalDate inspectedDate;
    private LocalDate maintenanceDate;
    private String status;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "transformer_id")
    @JsonBackReference
    private Transformer transformer;

    // --- NEW RELATIONSHIP ADDED ---
    @OneToOne(mappedBy = "inspection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private ThermalImage thermalImage;
}