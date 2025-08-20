import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // The Spring Boot backend URL

// Note: It's good practice to create a single, configured client.
// However, since some of your calls use axios directly, we'll keep it consistent.

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
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteBaselineImage = (transformerId) => {
    return axios.delete(`${API_BASE_URL}/api/transformers/${transformerId}/baseline-image`);
};

// --- CORRECTED THERMAL IMAGE FUNCTIONS ---

export const uploadThermalImage = (transformerId, formData) => {
    return axios.post(`http://localhost:8080/api/thermal-images/upload/${transformerId}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteThermalImage = (imageId) => {
    // Update the URL to point to the new ThermalImageController
    return axios.delete(`${API_BASE_URL}/api/thermal-images/${imageId}`);
};