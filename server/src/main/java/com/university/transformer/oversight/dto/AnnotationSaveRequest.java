package com.university.transformer.oversight.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class AnnotationSaveRequest {
    // This list holds the final, resulting bounding boxes that will be persisted
    // to the 'annotations' table.
    private List<AnnotationDTO> finalAnnotations;

    // This list holds the records of every 'ADDED', 'EDITED', or 'DELETED'
    // action, which will be logged to the 'annotation_logs' table.
    private List<AnnotationDTO> loggableChanges;
}