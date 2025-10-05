import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadThermalImage } from '../services/apiService';
import Toast from './Toast';
import { useAuth } from '../hooks/AuthContext';

/**
 * Component to handle the file upload process for the Maintenance Thermal Image.
 * Includes file validation, preview, and submission with loading state.
 */
const ThermalImageUpload = ({ inspectionId, onUploadSuccess }) => {
  // --- State Management ---
  const [file, setFile] = useState(null);
  const [condition, setCondition] = useState('SUNNY'); // Stores selected weather condition (matches backend ENUM)
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useAuth(); // Get authenticated user for uploader metadata

  // --- Image Preview Logic ---
  // Memoizes the local URL for the selected file, optimizing performance.
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  // Effect for cleanup: Revokes the object URL when the component unmounts or the URL changes.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /**
   * Handles file selection and client-side validation (type and size).
   */
  const onFileChange = (f) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type?.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) { // Max size is 8MB
      setError('Max size is 8MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  /**
   * Constructs FormData and submits the file to the backend API.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    // --- Construct FormData Payload ---
    const formData = new FormData();
    formData.append('file', file);
    formData.append('condition', condition);
    formData.append('uploader', user?.username || 'user'); // Add uploader metadata

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await uploadThermalImage(inspectionId, formData);

      setMessage('Upload successful!');
      setToast({ type: 'success', message: 'Thermal image uploaded' });
      setFile(null); // Clear input visual state

      // CRITICAL STEP: Notify parent (InspectionDetailPage) to trigger detection
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      setError('Upload failed. Please try again.');
      setToast({ type: 'error', message: 'Upload failed' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h4>Thermal Image</h4>
      <p className="text-muted">Upload a thermal image for this inspection.</p>

      {/* Image Preview Area */}
      {previewUrl && (
        <div className="mb-3 text-center">
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: 180,
              objectFit: 'contain',
              borderRadius: 6,
              border: '1px solid #ddd',
            }}
          />
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Environmental Condition Selection */}
        <Form.Group controlId="condition-select" className="mb-3">
          <Form.Label>Weather Condition</Form.Label>
          <Form.Select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="SUNNY">Sunny</option>
            <option value="CLOUDY">Cloudy</option>
            <option value="RAINY">Rainy</option>
          </Form.Select>
        </Form.Group>

        {/* File Input Control */}
        <Form.Group controlId="file-input" className="mb-3">
          <Form.Label>Image File</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <Form.Text muted>JPEG/PNG, max 8MB.</Form.Text>
        </Form.Group>

        {/* Submit Button with Loading Spinner */}
        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            'Upload Thermal Image'
          )}
        </Button>
      </Form>

      {/* Upload Status Messages */}
      {message && <Alert variant="success" className="mt-3">{message}</Alert>}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {/* Global Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ThermalImageUpload;