import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

/**
 * Modal component for adding or editing a Transformer record.
 * @param {boolean} show - Controls the modal's visibility.
 * @param {function} handleClose - Function to close the modal.
 * @param {function} onSave - Handler to submit form data for creation or update.
 * @param {object} transformer - The transformer object to edit (null if adding a new one).
 */
const TransformerModal = ({ show, handleClose, onSave, transformer }) => {
    const [formData, setFormData] = useState({});

    // Predefined options for dropdowns
    const transformerTypes = ['Bulk', 'Distribution'];
    const regions = ['Galle', 'Nugegoda', 'Colombo', 'Kurunegala', 'Gampaha', 'Ampara', 'Matara'];

    /**
     * Effect to initialize the form data. Runs when the modal is shown or the 'transformer' prop changes.
     * Loads existing data for editing or clears the form for adding a new record.
     */
    useEffect(() => {
        if (transformer) {
            // Load data for edit mode
            setFormData(transformer);
        } else {
            // Initialize empty strings for add mode
            setFormData({
                transformerId: '',
                poleId: '',
                region: '',
                transformerType: '',
                details: '',
                capacity: '',
                noOfFeeders: ''
            });
        }
    }, [transformer, show]);

    /**
     * Updates the form state whenever an input field changes.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Prevents default submit behavior and calls the parent's save handler.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {/* Dynamic title based on 'transformer' prop */}
                    {transformer ? 'Edit Transformer' : 'Add Transformer'}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>

                    {/* Transformer No. */}
                    <Form.Group className="mb-3">
                        <Form.Label>Transformer No.</Form.Label>
                        <Form.Control type="text" name="transformerId" value={formData.transformerId || ''} onChange={handleChange} required />
                    </Form.Group>

                    {/* Pole No. */}
                    <Form.Group className="mb-3">
                        <Form.Label>Pole No.</Form.Label>
                        <Form.Control type="text" name="poleId" value={formData.poleId || ''} onChange={handleChange} required />
                    </Form.Group>

                    {/* Region Select */}
                    <Form.Group className="mb-3">
                        <Form.Label>Region</Form.Label>
                        <Form.Select name="region" value={formData.region || ''} onChange={handleChange} required>
                            <option value="">Select Region</option>
                            {regions.map(r => <option key={r} value={r}>{r}</option>)}
                        </Form.Select>
                    </Form.Group>

                    {/* Type Select */}
                    <Form.Group className="mb-3">
                        <Form.Label>Type</Form.Label>
                        <Form.Select name="transformerType" value={formData.transformerType || ''} onChange={handleChange} required>
                            <option value="">Select Type</option>
                            {transformerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </Form.Select>
                    </Form.Group>

                    {/* Capacity */}
                    <Form.Group className="mb-3">
                        <Form.Label>Capacity (kVA)</Form.Label>
                        {/* Note: value={formData.capacity || ''} ensures component is controlled */}
                        <Form.Control type="number" name="capacity" value={formData.capacity || ''} onChange={handleChange} />
                    </Form.Group>

                    {/* Number of Feeders */}
                    <Form.Group className="mb-3">
                        <Form.Label>No. of Feeders</Form.Label>
                        <Form.Control type="number" name="noOfFeeders" value={formData.noOfFeeders || ''} onChange={handleChange} />
                    </Form.Group>

                    {/* Location Details */}
                    <Form.Group className="mb-3">
                        <Form.Label>Location Details</Form.Label>
                        <Form.Control type="text" name="details" value={formData.details || ''} onChange={handleChange} required />
                    </Form.Group>

                    {/* Action Buttons */}
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