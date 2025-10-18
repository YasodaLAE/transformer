import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // The Spring Boot backend URL

export const getAllTransformers = () => {
    return axios.get(`${API_BASE_URL}/api/transformers`);
};

export const getTransformerById = (id) => {
    return axios.get(`${API_BASE_URL}/api/transformers/${id}`);
};

export const getInspectionsByTransformer = (transformerId) => {
    return axios.get(`${API_BASE_URL}/api/inspections/by-transformer/${transformerId}`);
};

export const createTransformer = (transformerData) => {
    return axios.post(`${API_BASE_URL}/api/transformers`, transformerData);
};

export const deleteTransformer = (id) => {
    return axios.delete(`${API_BASE_URL}/api/transformers/${id}`);
};

export const createInspection = (inspectionData) => {
    return axios.post(`${API_BASE_URL}/api/inspections`, inspectionData);
};

export const deleteInspection = (id) => {
    return axios.delete(`${API_BASE_URL}/api/inspections/${id}`);
};

export const getInspectionById = (id) => {
    return axios.get(`${API_BASE_URL}/api/inspections/${id}`);
};

export const uploadBaselineImage = (transformerId, formData) => {
    return axios.post(`${API_BASE_URL}/api/transformers/${transformerId}/baseline-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const updateInspection = (id, inspectionData) => {
    return axios.put(`${API_BASE_URL}/api/inspections/${id}`, inspectionData);
};

export const deleteBaselineImage = (transformerId) => {
    return axios.delete(`${API_BASE_URL}/api/transformers/${transformerId}/baseline-image`);
};

export const uploadThermalImage = (inspectionId, formData) => {
    return axios.post(`${API_BASE_URL}/api/inspections/${inspectionId}/thermal-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteThermalImage = (imageId) => {
    return axios.delete(`${API_BASE_URL}/api/inspections/thermal-image/${imageId}`);
};

export const updateTransformer = (id, transformerData) => {
    return axios.put(`${API_BASE_URL}/api/transformers/${id}`, transformerData);
};

export const getAllInspections = async () => {
    return axios.get(`${API_BASE_URL}/api/inspections`);
};

export const getAnomalyDetectionResult = (inspectionId) => {
    return axios.get(`${API_BASE_URL}/api/inspections/${inspectionId}/anomalies`);
};

export const triggerAnomalyDetection = (inspectionId, baselineFileName, tempThresholdPercentage) => {
    const requestBody = {
            baselineFileName: baselineFileName,
            tempThresholdPercentage: tempThresholdPercentage
    };
    return axios.post(`${API_BASE_URL}/api/inspections/${inspectionId}/detect-anomalies`, requestBody);
};

export const getAnnotatedAnomalyImage = (inspectionId) => {
    return axios.get(`${API_BASE_URL}/api/inspections/${inspectionId}/anomalies/image`, {
        responseType: 'blob'
    });
};

// --- ANNOTATION FUNCTIONS ---

export const getAnnotations = async (inspectionId) => {
    const response = await axios.get(`${API_BASE_URL}/api/inspections/${inspectionId}/annotations`);
    return response.data;
};

export const saveAnnotations = async (inspectionId, saveRequest) => {
    // The payload must match the AnnotationSaveRequest DTO structure on the backend

    const response = await axios.post(`${API_BASE_URL}/api/inspections/${inspectionId}/annotations`, saveRequest);
    return response.data;
};

export const getAnnotationLogs = async (inspectionId) => {
    const response = await axios.get(`${API_BASE_URL}/api/inspections/${inspectionId}/annotation-logs`);
    return response.data;
};