package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "anomaly_feedback")
@Data
public class AnomalyFeedback {

    public enum AnnotationAction {
        AI_ORIGINAL, // The initial output from the AI model
        USER_ADDED,  // New box drawn by the user
        USER_EDITED, // Existing AI box was resized/moved
        USER_DELETED // Existing AI box was removed
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link back to the detection result that was modified
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false)
    private AnomalyDetectionResult detectionResult;

    // Annotation Metadata
    @Enumerated(EnumType.STRING)
    private AnnotationAction action;

    @Column(name = "annotator_user")
    private String annotatorUser;

    @Column(name = "timestamp")
    private LocalDateTime timestamp = LocalDateTime.now();

    // The JSON data of the anomaly that was affected (Bounding box details, type, score)
    @Column(columnDefinition = "TEXT")
    private String anomalyDataJson;

    @Column(name = "user_comments")
    private String userComments;

    // Getters and Setters...
}