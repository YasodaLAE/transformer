package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import org.hibernate.annotations.UpdateTimestamp;
// annotation.java (No change needed, but for clarity)

@Getter
@Setter
@Entity
@Table(name = "annotations")
public class Annotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    @JsonBackReference("inspection-annotations")
    private Inspection inspection;

    @Column(name = "annotation_type", nullable = false)
    private String currentStatus;

    @Column(name = "original_source", nullable = false)
    private String originalSource; // Stores the provenance: 'AI' or 'USER' (NEVER CHANGES)

    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @Column(name = "ai_severity_score")
    private Integer aiSeverityScore;

    // Bounding box coordinates
    private double x;
    private double y;
    private double width;
    private double height;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private String userId;
    @UpdateTimestamp
    private LocalDateTime timestamp;
    private boolean isDeleted = false; // Maps to is_deleted in DB

    @Column(name = "fault_type")
    private String faultType;

}