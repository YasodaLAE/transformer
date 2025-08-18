import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { createInspection } from '../services/apiService';

const AddInspectionModal = ({ show, handleClose, onInspectionAdded, transformerId }) => {
    const [inspectionNo, setInspectionNo] = useState('');
    const [inspectedDate, setInspectedDate] = useState('');
    const [maintenanceDate, setMaintenanceDate] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const newInspection = {
            inspectionNo,
            inspectedDate,
            maintenanceDate,
            status,
            // The transformer object is needed to link the inspection
            transformer: {
                id: transformerId,
            },
        };

        try {
            await createInspection(newInspection);
            onInspectionAdded(); // Function to refresh the list of inspections
            handleClose(); // Close the modal
        } catch (err) {
            console.error("Failed to add inspection:", err);
            setError('Failed to add inspection. Please check the form data.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Add New Inspection</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <div className="alert alert-danger">{error}</div>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Inspection No.</Form.Label>
                        <Form.Control
                            type="text"
                            value={inspectionNo}
                            onChange={(e) => setInspectionNo(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Inspected Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={inspectedDate}
                            onChange={(e) => setInspectedDate(e.target.value)}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Maintenance Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={maintenanceDate}
                            onChange={(e) => setMaintenanceDate(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Control
                            as="select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
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
                            Save Inspection
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AddInspectionModal;