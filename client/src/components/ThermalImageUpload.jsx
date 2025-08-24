import React, { useState } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadThermalImage } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext'; // Import useAuth hook

const ThermalImageUpload = ({ inspectionId, onUploadSuccess }) => { // <-- Prop changed
    const [file, setFile] = useState(null);
    const [condition, setCondition] = useState('Sunny');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { user } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        const fileSizeInMB = file.size / 1024 / 1024;
        if (fileSizeInMB > 10) {
            setError('File is too large. Please select a file smaller than 10MB.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('condition', condition);
        formData.append('uploader', user.username);

        setError('');
        setMessage('');
        setIsLoading(true);

        try {
             await uploadThermalImage(inspectionId, formData); // <-- Prop changed
            setMessage('Upload successful!');
            if (onUploadSuccess) {
                onUploadSuccess();
            }
        } catch (err) {
            setError('Upload failed. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h4>Thermal Image</h4>
            <p className="text-muted">Upload a thermal image for this inspection to identify potential issues.</p>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="condition-select" className="mb-3">
                    <Form.Label>Weather Condition</Form.Label>
                    <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="Sunny">Sunny</option>
                        <option value="Cloudy">Cloudy</option>
                        <option value="Rainy">Rainy</option>
                    </Form.Select>
                </Form.Group>
                <Form.Group controlId="file-input" className="mb-3">
                    <Form.Label>Image File</Form.Label>
                    <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                </Form.Group>
                <Button variant="primary" type="submit" disabled={isLoading}>
                    {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Upload Thermal Image'}
                </Button>
            </Form>
            {message && <Alert variant="success" className="mt-3">{message}</Alert>}
            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </div>
    );
};

export default ThermalImageUpload;