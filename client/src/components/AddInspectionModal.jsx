import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import { createInspection, updateInspection } from '../services/apiService';

function toDatetimeLocal(value) {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

const AddInspectionModal = ({
  loggedInUser,
  show,
  handleClose,
  onInspectionAdded,
  transformerId,
  inspectionToEdit,
  allTransformers = [],
}) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    inspectionNo: '',
    inspectedDate: '',
    maintenanceDate: '',
    status: '',
  });

  const [selectedTransformerId, setSelectedTransformerId] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reset form on open
  useEffect(() => {
    if (!show) return;

    if (inspectionToEdit) {
      setFormData({
        inspectionNo: inspectionToEdit.inspectionNo || '',
        inspectedDate: toDatetimeLocal(inspectionToEdit.inspectedDate),
        maintenanceDate: toDatetimeLocal(inspectionToEdit.maintenanceDate) || '',
        status: inspectionToEdit.status || '',
      });
      setSelectedTransformerId(
        inspectionToEdit.transformer?.id || transformerId || ''
      );
    } else {
      setFormData({
        inspectionNo: '',
        inspectedDate: '',
        maintenanceDate: '',
        status: '',
      });
      setSelectedTransformerId(transformerId || '');
    }

    setError(null);
  }, [show, inspectionToEdit, transformerId]);

  // Clear error when modal is closed
  useEffect(() => {
    if (!show) setError(null);
  }, [show]);

  const handleChange = (e) => {
    setFormData((s) => ({ ...s, [e.target.name]: e.target.value }));
  };

  const handleTransformerChange = (e) => {
    setSelectedTransformerId(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const inspectedBy = user?.username;
    const finalTransformerId =
      inspectionToEdit?.transformer?.id ||
      transformerId ||
      Number(selectedTransformerId);

    if (!finalTransformerId) {
      setError('Please select a transformer.');
      return;
    }
    if (!formData.inspectionNo?.trim()) {
      setError('Inspection No. is required.');
      return;
    }
    if (!formData.inspectedDate) {
      setError('Inspected Date is required.');
      return;
    }
    if (!formData.status) {
      setError('Status is required.');
      return;
    }

    try {
      setSaving(true);

      if (inspectionToEdit) {
        const updatedData = {
          ...formData,
          id: inspectionToEdit.id,
          inspectedBy,
          transformer: { id: finalTransformerId },
        };
        await updateInspection(updatedData.id, updatedData);

        setError(null);
        onInspectionAdded?.('updated');
        handleClose();
        return;
      } else {
        const newData = {
          ...formData,
          inspectedBy,
          transformer: { id: finalTransformerId },
        };
        await createInspection(newData);

        setError(null);
        onInspectionAdded?.('created');
        handleClose();
        return;
      }
    } catch (err) {
      console.error('Failed to save inspection:', err);
      setError('Failed to save inspection. Please check the form data.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {inspectionToEdit ? 'Edit Inspection' : 'Add New Inspection'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}

        <Form onSubmit={handleSubmit}>
          {!inspectionToEdit && !transformerId && (
            <Form.Group className="mb-3">
              <Form.Label>Transformer</Form.Label>
              <Form.Select
                name="transformerId"
                value={selectedTransformerId}
                onChange={handleTransformerChange}
                required
              >
                <option value="">Select a Transformer</option>
                {Array.isArray(allTransformers) &&
                  allTransformers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.transformerId}
                    </option>
                  ))}
              </Form.Select>
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
            <Form.Label>Inspected Date &amp; Time</Form.Label>
            <Form.Control
              type="datetime-local"
              name="inspectedDate"
              value={formData.inspectedDate}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Maintenance Date &amp; Time</Form.Label>
            <Form.Control
              type="datetime-local"
              name="maintenanceDate"
              value={formData.maintenanceDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">Select Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </Form.Select>
          </Form.Group>

          <div className="text-end">
            <Button
              variant="secondary"
              onClick={handleClose}
              className="me-2"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving
                ? 'Saving...'
                : inspectionToEdit
                ? 'Save Changes'
                : 'Save Inspection'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddInspectionModal;
