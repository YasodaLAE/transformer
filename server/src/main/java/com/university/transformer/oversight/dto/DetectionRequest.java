package com.university.transformer.oversight.dto;

// This is a simple DTO to match the JSON body sent by React

public class DetectionRequest {
    private String baselineFileName;
    private Double tempThresholdPercentage;

    // Getters and Setters (REQUIRED for Spring to deserialize JSON)

    public String getBaselineFileName() {
        return baselineFileName;
    }

    public void setBaselineFileName(String baselineFileName) {
        this.baselineFileName = baselineFileName;
    }

    public Double getTempThresholdPercentage() {
        return tempThresholdPercentage;
    }

    public void setTempThresholdPercentage(Double tempThresholdPercentage) {
        this.tempThresholdPercentage = tempThresholdPercentage;
    }
}