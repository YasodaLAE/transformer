import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
// Make sure to add 'updateInspection' to your imports
import { createInspection, updateInspection } from '../services/apiService';

// The component now accepts an optional 'inspectionToEdit' prop
const AddInspectionModal = ({ show, handleClose, onInspectionAdded, transformerId, inspectionToEdit }) => {
    const [formData, setFormData] = useState({
        inspectionNo: '',
        inspectedDate: '',
        maintenanceDate: '',
        status: '',
    });
    const [error, setError] = useState(null);

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
        } else {
            setFormData({
                inspectionNo: '',
                inspectedDate: '',
                maintenanceDate: '',
                status: '',
            });
        }
    }, [inspectionToEdit]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (inspectionToEdit) {
                // If in Edit mode, call the update API
                const updatedData = { ...formData, id: inspectionToEdit.id };
                await updateInspection(updatedData.id, updatedData);
            } else {
                // If in Add mode, call the create API
                const newData = { ...formData, transformer: { id: transformerId } };
                await createInspection(newData);
            }
            onInspectionAdded(); // This will re-fetch data and close the modal
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
                            type="date"
                            name="inspectedDate"
                            value={formData.inspectedDate}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Maintenance Date</Form.Label>
                        <Form.Control
                            type="date"
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