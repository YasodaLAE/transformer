package com.university.transformer.oversight.dto;


public class DetectionRequest {
    private String baselineFileName;
    private Double tempThresholdPercentage;

    // Getters and Setters

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