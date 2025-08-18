// src/components/AddTransformerModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createTransformer } from '../services/apiService';

const AddTransformerModal = ({ show, handleClose, onTransformerAdded }) => {
    const [transformer, setTransformer] = useState(null);
    const [transformerId, setTransformerId] = useState(null);
    const [region, setRegion] = useState('');
    const [poleId, setPoleId] = useState('');
    const [tType, setType] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const newTransformer = {
            transformerId,
            poleId,
            region,
            type
        };

        try {
            await createTransformer(newTransformer);
            // Clear form
            setTransformerId('');
            setRegion('');
            setPoleId('');
            setType('');
            // Notify parent component to refresh the list
            onTransformerAdded();
            // Close the modal
            handleClose();
        } catch (err) {
            setError('Failed to add transformer. Please try again.');
            console.error(err);
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add New Transformer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <p className="text-danger">{error}</p>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Transformer No.</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., AZ-8890"
                            value={transformerId}
                            onChange={(e) => setTransformerId(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Location</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., Nugegoda"
                            value={location}
                            onChange={(e) => setRegion(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Pole No.</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="e.g., EN-xxxx"
                            value={poleId}
                            onChange={(e) => setPoleId(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="e.g., 100.0"
                            value={tType}
                            onChange={(e) => setType(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Button variant="secondary" onClick={handleClose} className="me-2">
                        Cancel
                    </Button>
                    <Button variant="primary" type="submit">
                        Save Transformer
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddTransformerModal;