package com.university.transformer.oversight.dto;

import com.university.transformer.oversight.model.ThermalImage;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ThermalImageDTO {
    private Long id;
    private String fileName;
    private String uploaderId;
    private LocalDateTime uploadTimestamp;

    public ThermalImageDTO(ThermalImage image) {
        this.id = image.getId();
        this.fileName = image.getFileName();
        this.uploaderId = image.getUploaderId();
        this.uploadTimestamp = image.getUploadTimestamp();
    }
}