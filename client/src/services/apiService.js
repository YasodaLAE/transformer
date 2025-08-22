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

// --- UPDATED THERMAL IMAGE FUNCTIONS ---

export const uploadThermalImage = (inspectionId, formData) => {
    // URL now points to the InspectionController
    return axios.post(`${API_BASE_URL}/api/inspections/${inspectionId}/thermal-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
};

export const deleteThermalImage = (imageId) => {
    // URL now points to the InspectionController
    return axios.delete(`${API_BASE_URL}/api/inspections/thermal-image/${imageId}`);
};

export const updateTransformer = (id, transformerData) => {
    return axios.put(`http://localhost:8080/api/transformers/${id}`, transformerData);
};

export const getAllInspections = async () => {
    return axios.get(`${API_BASE_URL}/inspections`);
};
