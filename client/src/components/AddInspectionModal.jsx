import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
// Make sure to add 'updateInspection' to your imports
import { createInspection, updateInspection } from '../services/apiService';

// The component now accepts an optional 'inspectionToEdit' prop
const AddInspectionModal = ({ show, handleClose, onInspectionAdded, transformerId, inspectionToEdit, allTransformers }) => {
    const [formData, setFormData] = useState({
        inspectionNo: '',
        inspectedDate: '',
        maintenanceDate: '',
        status: '',
    });
    const [error, setError] = useState(null);
    const [selectedTransformerId, setSelectedTransformerId] = useState('');

    // This effect runs when inspectionToEdit changes.
    // It populates the form for editing or resets it for adding.
    useEffect(() => {
        if (inspectionToEdit) {
            setFormData({
                inspectionNo: inspectionToEdit.inspectionNo,
                inspectedDate: inspectionToEdit.inspectedDate,
                maintenanceDate: inspectionToEdit.maintenanceDate || '',
                status: inspectionToEdit.status,
            });
        setSelectedTransformerId(inspectionToEdit.transformer ? inspectionToEdit.transformer.id:'');
        } else {
            setFormData({
                inspectionNo: '',
                inspectedDate: '',
                maintenanceDate: '',
                status: '',
            });
        setSelectedTransformerId('');
        }
    }, [inspectionToEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTransformerChange = (e) => {
            setSelectedTransformerId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            let finalTransformerId;

            if (inspectionToEdit) {
                finalTransformerId = inspectionToEdit.transformer ? inspectionToEdit.transformer.id:null;

            } else if (transformerId){
                finalTransformerId = transformerId;
                }

            else {
                finalTransformerId = Number(selectedTransformerId);
            }
        if (!finalTransformerId) {
                setError('Please select a transformer.');
                return;
            }

            if (inspectionToEdit) {
                const updatedData = { ...formData, id: inspectionToEdit.id, transformer: { id: finalTransformerId } };
                await updateInspection(updatedData.id, updatedData);
            } else {
                const newData = { ...formData, transformer: { id: finalTransformerId } };
                await createInspection(newData);
            }

            onInspectionAdded();
            handleClose();
        } catch (err) {
            console.error("Failed to save inspection:", err);
            setError('Failed to save inspection. Please check the form data.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>{inspectionToEdit ? 'Edit Inspection' : 'Add New Inspection'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                <Form onSubmit={handleSubmit}>
                    {!inspectionToEdit && !transformerId && (
                        <Form.Group className="mb-3">
                            <Form.Label>Transformer</Form.Label>
                            <Form.Control
                                as="select"
                                name="transformerId"
                                value={selectedTransformerId}
                                onChange={handleTransformerChange}
                                required
                            >
                                <option value="">Select a Transformer</option>
                                {Array.isArray(allTransformers) && allTransformers.map(transformer => (
                                    <option key={transformer.id} value={transformer.id}>
                                        {transformer.transformerId}
                                    </option>
                                ))}
                            </Form.Control>
                        </Form.Group>
       )}
                    <Form.Group className="mb-3">
                        <Form.Label>Inspection No.</Form.Label>
                        <Form.Control
                            type="text"
                            name="inspectionNo"
                            value={formData.inspectionNo}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Inspected Date</Form.Label>
                            <Form.Control
                                type="datetime-local"
                                name="inspectedDate"
                                value={formData.inspectedDate}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Maintenance Date</Form.Label>
                                        <Form.Control
                                            type="datetime-local"
                                            name="maintenanceDate"
                                            value={formData.maintenanceDate}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                            as="select"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select Status</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                        </Form.Control>
                    </Form.Group>
                    <div className="text-end">
                        <Button variant="secondary" onClick={handleClose} className="me-2">
                            Cancel
                        </Button>
                        <Button variant="primary" type="submit">
                            {inspectionToEdit ? 'Save Changes' : 'Save Inspection'}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddInspectionModal;