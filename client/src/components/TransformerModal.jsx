import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const TransformerModal = ({ show, handleClose, onSave, transformer }) => {
    const [formData, setFormData] = useState({});
    const transformerTypes = ['Bulk', 'Distribution'];
    const regions = ['Galle', 'Nugegoda', 'Colombo', 'Kurunegala', 'Gampaha', 'Ampara', 'Matara'];

    useEffect(() => {
        if (transformer) {
            setFormData(transformer); // If a transformer is passed, populate the form for editing
        } else {
            // Otherwise, reset the form for adding a new one
            setFormData({ transformerId: '', poleId: '', region: '', transformerType: '', details: '' });
        }
    }, [transformer, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{transformer ? 'Edit Transformer' : 'Add Transformer'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Transformer No.</Form.Label>
                        <Form.Control type="text" name="transformerId" value={formData.transformerId || ''} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Pole No.</Form.Label>
                        <Form.Control type="text" name="poleId" value={formData.poleId || ''} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Region</Form.Label>
                        <Form.Select name="region" value={formData.region || ''} onChange={handleChange} required>
                            <option value="">Select Region</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select name="transformerType" value={formData.transformerType || ''} onChange={handleChange} required>
                            <option value="">Select Type</option>
                            {transformerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Location Details</Form.Label>
                        <Form.Control type="text" name="details" value={formData.details || ''} onChange={handleChange} required />
                    </Form.Group>
                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
                        <Button variant="primary" type="submit">Save Transformer</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default TransformerModal;