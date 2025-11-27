import React, { useEffect, useState } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';

/**
 * Modal component for uploading a Baseline Thermal Image associated with a Transformer.
 * * Includes fields for the image file and environmental condition, and sends the
 * file as FormData to the backend.
 */
const BaselineImageUploader = ({ transformerId, onUploadSuccess }) => {
    // Component State Management
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [condition, setCondition] = useState(''); // Stores selected environmental condition

    const { user } = useAuth();

    const handleFileChange = (e) => {
        // Capture the file object when input changes
        setSelectedFile(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // --- Validation ---
        if (!selectedFile) {
            setError("Please select a file to upload.");
            return;
        }

        if (!condition) {
            setError("Please select an environmental condition.");
            return;
        }
        // --- End Validation ---

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('condition', condition); // Pass the chosen condition to the backend
        formData.append('uploader', user.username); // Include current user as metadata

        try {
            // API call to upload the file and metadata
            await uploadBaselineImage(transformerId, formData);

            setSuccess("Baseline image uploaded successfully!");
            setShowModal(false); // Close the modal on success

            onUploadSuccess(selectedFile.name);
        } catch (err) {
            console.error('Upload failed:', err);
            setError("Failed to upload image. Please try again.");
        }
    };

    return (
        <>
            {/* Button to open the upload modal */}
            <Button
                variant="light"
                onClick={() => setShowModal(true)}
                className="py-1 px-2 border d-flex align-items-center"
            >
                <i className="bi bi-upload me-2"></i>
                <span className="d-none d-sm-block">Upload Baseline Image</span>
            </Button>

            {/* Modal for file and condition selection */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Baseline Image</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Form onSubmit={handleUpload}>
                        {/* Environmental Condition Selection */}
                        <Form.Group className="mb-3">
                            <Form.Label>Select Environmental Condition</Form.Label>
                            <Form.Select onChange={(e) => setCondition(e.target.value)} required>
                                <option value="">-- Select Condition --</option>
                                <option value="Sunny">Sunny</option>
                                <option value="Cloudy">Cloudy</option>
                                <option value="Rainy">Rainy</option>
                            </Form.Select>
                         </Form.Group>

                        {/* File Input */}
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