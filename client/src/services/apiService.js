// src/services/apiService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080'; // The Spring Boot backend URL

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAllTransformers = () => {
    return apiClient.get('/api/transformers');
};

export const getTransformerById = (id) => {
    return apiClient.get(`/api/transformers/${id}`);
};

export const getInspectionsByTransformer = (id) => {
    return apiClient.get(`/api/transformers/${id}`);
};

export const createTransformer = (transformerData) => {
    return apiClient.post('/api/transformers', transformerData);
};

export const uploadImage = (transformerId, formData) => {
    return apiClient.post(`/api/transformers/${transformerId}/images`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteTransformer = (id) => {
    return apiClient.delete(`/api/transformers/${id}`);
};