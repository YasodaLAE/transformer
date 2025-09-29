import React, { useMemo, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import ZoomableImage from './ZoomableImage';
import Toast from './Toast';

const BaselineImageUploader = ({ show, handleClose, onUploadSuccess, transformerId }) => {
  const [file, setFile] = useState(null);
  const [condition, setCondition] = useState('SUNNY'); // enum-friendly
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { user } = useAuth();
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  const onFileChange = (f) => {
    if (!f) { setFile(null); return; }
    if (!f.type?.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (f.size > 8 * 1024 * 1024) { setError('Max size is 8MB.'); return; }
    setError('');
    setFile(f);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) { setError('Please select a file.'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('condition', condition);
    formData.append('uploader', user?.username || 'user');

    setIsLoading(true);
    setError('');

    try {
      await uploadBaselineImage(transformerId, formData);
      setToast({ type: 'success', message: 'Baseline image uploaded' });
      setFile(null);
      if (onUploadSuccess) onUploadSuccess(); // refresh parent
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
        {previewUrl && (
          <div className="mb-3">
            <ZoomableImage src={previewUrl} alt="Preview" style={{ height: 280 }} />
          </div>
        )}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Environmental Condition</Form.Label>
            <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="SUNNY">Sunny</option>
              <option value="CLOUDY">Cloudy</option>
              <option value="RAINY">Rainy</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Image File</Form.Label>
            <Form.Control type="file" onChange={(e) => onFileChange(e.target.files?.[0])} />
            <Form.Text muted>JPEG/PNG, max 8MB.</Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? <Spinner size="sm" /> : 'Upload'}
            </Button>
          </div>

          {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
        </Form>
      </Modal.Body>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </Modal>
  );
};

export default BaselineImageUploader;
