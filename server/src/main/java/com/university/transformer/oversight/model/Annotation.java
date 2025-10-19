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

    // Mapping 'type' field in Java to 'annotation_type' column in DB
//    @Column(name = "annotation_type", nullable = false)
//    private String type; // Will store the final state type, e.g., "USER_VALIDATED" or "USER_ADDED"
    @Column(name = "annotation_type", nullable = false)
    private String currentStatus; // ⬅️ RENAMED: Maps to 'annotation_type' in DB. Stores status like "USER_VALIDATED".

    @Column(name = "original_source", nullable = false) // ⬅️ NEW FIELD
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
}