package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

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
    @Column(name = "annotation_type", nullable = false)
    private String type; // Will store the final state type, e.g., "USER_VALIDATED" or "USER_ADDED"

    // Bounding box coordinates
    private double x;
    private double y;
    private double width;
    private double height;

    @Column(columnDefinition = "TEXT")
    private String comments;

    private String userId;

    private LocalDateTime timestamp;
    private boolean isDeleted = false; // Maps to is_deleted in DB
}