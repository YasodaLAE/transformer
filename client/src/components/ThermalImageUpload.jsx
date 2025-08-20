import React, { useState } from 'react';
import axios from 'axios';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';

const ThermalImageUpload = ({ transformerId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [condition, setCondition] = useState('Sunny');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('condition', condition);

        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            await axios.post(
                `http://localhost:8080/api/transformers/${transformerId}/thermal-image`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setMessage('Upload successful!');
            if (onUploadSuccess) {
                onUploadSuccess(); // This will refresh the parent page's data
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
            <p className="text-muted">Upload a thermal image of the transformer to identify potential issues.</p>
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