// src/components/AddTransformerModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createTransformer } from '../services/apiService';

const AddTransformerModal = ({ show, handleClose, onTransformerAdded }) => {
    const [transformer, setTransformer] = useState(null);
    const [transformerId, setTransformerId] = useState(null);
    const [location, setLocation] = useState('');
    const [capacity, setCapacity] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const newTransformer = {
            transformerId,
            location,
            capacity: parseFloat(capacity)
        };

        try {
            await createTransformer(newTransformer);
            // Clear form
            setTransformerId('');
            setLocation('');
            setCapacity('');
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
                            onChange={(e) => setLocation(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Capacity (kVA)</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="e.g., 100.0"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
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