import React, { useEffect, useMemo, useState } from 'react';
import { Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadThermalImage } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import Toast from './Toast';

const ThermalImageUpload = ({ inspectionId, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [condition, setCondition] = useState('SUNNY');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useAuth();

  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileChange = (f) => {
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.type?.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setError('Max size is 8MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('condition', condition);
    formData.append('uploader', user?.username || 'user');

    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await uploadThermalImage(inspectionId, formData);
      setMessage('Upload successful!');
      setToast({ type: 'success', message: 'Thermal image uploaded' });
      setFile(null);
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

      {previewUrl && (
        <div className="mb-3 text-center">
          <img
            src={previewUrl}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: 180,   // 👈 adjust to control size
              objectFit: 'contain',
              borderRadius: 6,
              border: '1px solid #ddd',
            }}
          />
        </div>
      )}

      <Form onSubmit={handleSubmit}>
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

        <Form.Group controlId="file-input" className="mb-3">
          <Form.Label>Image File</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => onFileChange(e.target.files?.[0])}
          />
          <Form.Text muted>JPEG/PNG, max 8MB.</Form.Text>
        </Form.Group>

        <Button variant="primary" type="submit" disabled={isLoading}>
          {isLoading ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            'Upload Thermal Image'
          )}
        </Button>
      </Form>

      {message && <Alert variant="success" className="mt-3">{message}</Alert>}
      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ThermalImageUpload;
