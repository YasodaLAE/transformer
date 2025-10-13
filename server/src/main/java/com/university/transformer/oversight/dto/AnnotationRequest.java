// (DTO for PUT /annotations)
package com.university.transformer.oversight.dto;

import java.util.List;
import java.util.Map;

public class AnnotationRequest {
    //modified JSON array of anomalies from the frontend
    private List<Map<String, Object>> finalAnnotations;
    private String annotatorUser; // Logged in username

    // Getters and Setters...
    public List<Map<String, Object>> getFinalAnnotations() { return finalAnnotations; }
    public void setFinalAnnotations(List<Map<String, Object>> finalAnnotations) { this.finalAnnotations = finalAnnotations; }
    public String getAnnotatorUser() { return annotatorUser; }
    public void setAnnotatorUser(String annotatorUser) { this.annotatorUser = annotatorUser; }
}