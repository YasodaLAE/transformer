package com.university.transformer.oversight.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class AnnotationDTO {
    private Long id;
    private String type;
    private double x;
    private double y;
    private double width;
    private double height;
    private String comments;
    private String userId;
    private LocalDateTime timestamp;
}