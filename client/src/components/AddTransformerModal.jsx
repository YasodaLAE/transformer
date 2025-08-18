// src/components/AddTransformerModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createTransformer } from '../services/apiService';

const AddTransformerModal = ({ show, handleClose, onTransformerAdded }) => {
    const [transformer, setTransformer] = useState('');
    const [transformerId, setTransformerId] = useState('');
    const [region, setRegion] = useState('');
    const [poleId, setPoleId] = useState('');
    const [tType, setType] = useState('');
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const transformerTypes = ['Bulk', 'Distribution'];
    const regions = ['Galle', 'Nugegoda', 'Colombo', 'Kurunegala', 'Gampaha', 'Ampara','Matara'];
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const newTransformer = {
            transformerId,
            poleId,
            region,
            tType
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
                <Modal.Title>Add Transformer</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <p className="text-danger">{error}</p>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Transformer No.</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Transformer No"
                            value={transformerId}
                            onChange={(e) => setTransformerId(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Pole No.</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Pole No"
                            value={poleId}
                            onChange={(e) => setPoleId(e.target.value)}
                            required
                        />
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label>Region</Form.Label>
                        <Form.Select
                            type="text"
                            placeholder="Type"
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            required
                        >
                            {regions.map(type => (
                                <option key={type} value={type}>{type}</option>
                                ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select
                            type="text"
                            placeholder="Type"
                            value={tType}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            {transformerTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                                ))}
                        </Form.Select>

                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Location Details</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Location Details"
                            value={text}
                            onChange={(e) => setText(e.target.value)}
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