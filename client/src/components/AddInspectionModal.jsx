import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { createInspection, updateInspection, getAllTransformers } from '../services/apiService';

const AddInspectionModal = ({ show, handleClose, onSave, transformerId, inspectionToEdit }) => {
    const [formData, setFormData] = useState({});
    const [transformers, setTransformers] = useState([]);
    const [selectedTransformerId, setSelectedTransformerId] = useState(transformerId || '');
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && !inspectionToEdit && !transformerId) {
            const fetchTransformers = async () => {
                try {
                    const response = await getAllTransformers();
                    setTransformers(response.data);
                } catch (err) {
                    console.error("Failed to fetch transformers", err);
                }
            };
            fetchTransformers();
        }

        if (show) {
            if (inspectionToEdit) {
                setFormData({
                    inspectionNo: inspectionToEdit.inspectionNo,
                    inspectedDate: inspectionToEdit.inspectedDate,
                    status: inspectionToEdit.status
                });
                setSelectedTransformerId(inspectionToEdit.transformerDbId);
            } else {
                setFormData({ inspectionNo: '', inspectedDate: '', status: 'Pending' });
                setSelectedTransformerId(transformerId || '');
            }
            setError('');
        }
    }, [show, inspectionToEdit, transformerId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (inspectionToEdit) {
                const updatedData = { ...formData, id: inspectionToEdit.id };
                await updateInspection(updatedData.id, updatedData);
            } else {
                const newData = { ...formData, transformer: { id: selectedTransformerId } };
                await createInspection(newData);
            }
            onSave();
            handleClose();
        } catch (err) {
            setError('Failed to save inspection.');
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>{inspectionToEdit ? 'Edit Inspection' : 'Add Inspection'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    {!transformerId && !inspectionToEdit && (
                        <Form.Group className="mb-3">
                            <Form.Label>Select Transformer</Form.Label>
                            <Form.Select required value={selectedTransformerId} onChange={(e) => setSelectedTransformerId(e.target.value)}>
                                <option value="">-- Select a Transformer --</option>
                                {transformers.map(t => (
                                    <option key={t.id} value={t.id}>{t.transformerId} - {t.region}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    )}
                    <Form.Group className="mb-3">
                        <Form.Label>Inspection No.</Form.Label>
                        <Form.Control type="text" name="inspectionNo" value={formData.inspectionNo || ''} onChange={(e) => setFormData({...formData, inspectionNo: e.target.value})} required />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Control
                                type="datetime-local" // <-- Change this from "date"
                                name="inspectedDate"
                                value={formData.inspectedDate || ''}
                                onChange={(e) => setFormData({...formData, inspectedDate: e.target.value})}
                                required
                            />
                        </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select name="status" value={formData.status || ''} onChange={(e) => setFormData({...formData, status: e.target.value})} required>
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                        </Form.Select>
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
                        <Button variant="primary" type="submit">Save</Button>
                    </div>
                </Form>
                {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
            </Modal.Body>
        </Modal>
    );
};

export default AddInspectionModal;