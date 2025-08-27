import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService'; 


const BaselineImageUploader = ({ show, handleClose, onUploadSuccess, transformerId }) => {
    const [file, setFile] = useState(null);
    const [condition, setCondition] = useState('Sunny');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('condition', condition);
        formData.append('uploader', user.username); // Placeholder

        setIsLoading(true);
        setError('');

        try {
            // Call the function
            await uploadBaselineImage(transformerId, formData);
            onUploadSuccess(); // Refresh parent component
            handleClose();     // Close the modal
        } catch (err) {
            setError('Upload failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Upload Baseline Image</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Environmental Condition</Form.Label>
                        <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                            <option>-- Select Condition --</option>
                            <option value="Sunny">Sunny</option>
                            <option value="Cloudy">Cloudy</option>
                            <option value="Rainy">Rainy</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Image File</Form.Label>
                        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : 'Upload'}
                        </Button>
                    </div>
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                </Modal.Body>
        </Modal>
    );
};

export default BaselineImageUploader;
