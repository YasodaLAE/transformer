package com.university.transformer.oversight.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "annotation_logs")
public class AnnotationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Link to the inspection
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inspection_id", nullable = false)
    private Inspection inspection;

    // A transient ID for the bounding box being edited (e.g., "ai-0", "user-1").
    // This is NOT the primary key of the Annotation table, but a key to track the item in the UI/session.
    @Column(name = "box_session_id", nullable = false)
    private String boxSessionId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "action_type", nullable = false)
    private String actionType; // e.g., "ADDED", "EDITED", "DELETED"

    @Column(columnDefinition = "TEXT")
    private String comments; // User-provided comment for the change

    @Column(name = "log_timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "original_state_json", columnDefinition = "TEXT")
    private String originalStateJson; // JSON string of the state BEFORE the action

    @Column(name = "modified_state_json", columnDefinition = "TEXT")
    private String modifiedStateJson; // JSON string of the state AFTER the action

    // Flag to indicate if the final saved annotation is AI-generated (false) or user-modified (true)
    private boolean isUserModified;

}