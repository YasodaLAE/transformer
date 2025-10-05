import React, { useMemo, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import ZoomableImage from './ZoomableImage'; // Custom component for image preview
import Toast from './Toast';

/**
 * Modal component for handling the upload of a Baseline Thermal Image.
 * It includes file validation, condition selection, image preview, and handles API submission.
 */
const BaselineImageUploader = ({ show, handleClose, onUploadSuccess, transformerId }) => {
  const [file, setFile] = useState(null);
  const [condition, setCondition] = useState('SUNNY'); // Default condition (matches backend ENUM)
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useAuth();

  // Create a URL for the local file to display an image preview in the modal
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  /**
   * Handles file selection and basic validation (type and size).
   */
  const onFileChange = (f) => {
    if (!f) { setFile(null); return; }
    if (!f.type?.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (f.size > 8 * 1024 * 1024) { setError('Max size is 8MB.'); return; } // 8MB limit
    setError('');
    setFile(f);
  };

  /**
   * Submits the image file and metadata (condition, uploader) to the backend API.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) { setError('Please select a file.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('condition', condition);
    // Use current user's username for tracking the uploader
    formData.append('uploader', user?.username || 'user');

    setIsLoading(true);
    setError('');

    try {
      // API call sends the FormData object
      await uploadBaselineImage(transformerId, formData);

      setToast({ type: 'success', message: 'Baseline image uploaded' });
      setFile(null); // Clear file input state

      // Notify parent component (InspectionDetailPage) to refresh data and status
      if (onUploadSuccess) onUploadSuccess();

      handleClose();
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
      setToast({ type: 'error', message: 'Upload failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Upload Baseline Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Image Preview: Uses ZoomableImage for user experience */}
        {previewUrl && (
          <div className="mb-3">
            <ZoomableImage src={previewUrl} alt="Preview" style={{ height: 280 }} />
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Environmental Condition Selection (Maps to backend ENUM) */}
          <Form.Group className="mb-3">
            <Form.Label>Environmental Condition</Form.Label>
            <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="SUNNY">Sunny</option>
              <option value="CLOUDY">Cloudy</option>
              <option value="RAINY">Rainy</option>
            </Form.Select>
          </Form.Group>

          {/* File Input Control */}
          <Form.Group className="mb-3">
            <Form.Label>Image File</Form.Label>
            <Form.Control type="file" onChange={(e) => onFileChange(e.target.files?.[0])} />
            <Form.Text muted>JPEG/PNG, max 8MB.</Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>

            {/* Submit Button with Loading State */}
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Upload'}
            </Button>
          </div>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Form>
      </Modal.Body>

      {/* Global Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </Modal>
  );
};

export default BaselineImageUploader;