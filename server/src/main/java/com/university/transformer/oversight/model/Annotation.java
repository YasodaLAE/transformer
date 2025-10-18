package com.university.transformer.oversight.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "annotations")
public class Annotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Establishes the many-to-one link to Inspection
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    @JsonBackReference("inspection-annotations")
    private Inspection inspection;

    @Column(name = "annotation_type", nullable = false)
    private String type; // e.g., "AI_DETECTED", "USER_ADDED", "USER_MODIFIED"

    // Bounding box coordinates
    private double x;
    private double y;
    private double width;
    private double height;

    @Column(columnDefinition = "TEXT")
    private String comments; // Optional user notes

    private String userId;

    private LocalDateTime timestamp;
}