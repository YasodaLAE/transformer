// src/components/ImageUploadForm.jsx
import React, { useState } from 'react';
import { uploadImage } from '../services/apiService';

const ImageUploadForm = ({ transformerId }) => {
    const = useState(null);
    const = useState('BASELINE');
    const [condition, setCondition] = useState('SUNNY');
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setMessage('Please select a file to upload.');
            return;
        }

        setIsUploading(true);
        setMessage('Uploading...');

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('imageType', imageType);
        formData.append('condition', condition);

        try {
            await uploadImage(transformerId, formData);
            setMessage('File uploaded successfully!');
        } catch (error) {
            setMessage('File upload failed. Please try again.');
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="card mt-4">
            <div className="card-body">
                <h5 className="card-title">Upload New Thermal Image</h5>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="fileInput" className="form-label">Thermal Image</label>
                        <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="imageTypeSelect" className="form-label">Image Type</label>
                        <select id="imageTypeSelect" className="form-select" value={imageType} onChange={(e) => setImageType(e.target.value)}>
                            <option value="BASELINE">Baseline</option>
                            <option value="MAINTENANCE">Maintenance</option>
                        </select>
                    </div>
                    {imageType === 'BASELINE' && (
                        <div className="mb-3">
                            <label htmlFor="conditionSelect" className="form-label">Environmental Condition</label>
                            <select id="conditionSelect" className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                                <option value="SUNNY">Sunny</option>
                                <option value="CLOUDY">Cloudy</option>
                                <option value="RAINY">Rainy</option>
                            </select>
                        </div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={isUploading}>
                        {isUploading? 'Uploading...' : 'Upload'}
                    </button>
                </form>
                {message && <div className="alert alert-info mt-3">{message}</div>}
            </div>
        </div>
    );
};

export default ImageUploadForm;