import React, { useState } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService';

const BaselineImageUploader = ({ transformerId, onUploadSuccess }) => {
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [condition, setCondition] = useState(''); // New state for the condition

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedFile) {
            setError("Please select a file to upload.");
            return;
        }

        if (!condition) {
            setError("Please select an environmental condition.");
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('condition', condition); // Add the condition formdata

        try {
            await uploadBaselineImage(transformerId, formData);
            setSuccess("Baseline image uploaded successfully!");
            setShowModal(false); // Close the modal on success
            onUploadSuccess(selectedFile.name); // Pass the filename to the parent
        } catch (err) {
            console.error('Upload failed:', err);
            setError("Failed to upload image. Please try again.");
        }
    };

    return (
        <>
            <Button
                variant="light"
                onClick={() => setShowModal(true)}
                className="py-1 px-2 border d-flex align-items-center"
            >
                <i className="bi bi-upload me-2"></i>
                <span className="d-none d-sm-block">Upload Baseline Image</span>
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Baseline Image</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}
                    <Form onSubmit={handleUpload}>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Environmental Condition</Form.Label>
                            <Form.Select onChange={(e) => setCondition(e.target.value)} required>
                                <option value="">-- Select Condition --</option>
                                <option value="Sunny">Sunny</option>
                                <option value="Cloudy">Cloudy</option>
                                <option value="Rainy">Rainy</option>
                            </Form.Select>
                         </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Select Image File</Form.Label>
                            <Form.Control type="file" onChange={handleFileChange} required />
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100">
                            Upload
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default BaselineImageUploader;