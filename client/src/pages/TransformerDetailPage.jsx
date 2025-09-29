// src/pages/TransformerDetailPage.jsx
import React, { useMemo, useState } from 'react';
import { uploadThermalImage, uploadBaselineImage } from '../services/apiService'; // ✔ import correct APIs
import Toast from '../components/Toast';            // ✔ toast you created
import ZoomableImage from '../components/ZoomableImage'; // (optional) preview

const ImageUploadForm = ({ transformerId, inspectionId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageType, setImageType] = useState('BASELINE');
  const [condition, setCondition] = useState('SUNNY');
  const [message, setMessage] = useState('');      // keep your message if you want
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);        // ✔ for notifications

  // (optional) client-side preview
  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  const setOk = (m) => setToast({ type: 'success', message: m });
  const setErr = (m) => setToast({ type: 'error', message: m });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) { setSelectedFile(null); return; }
    if (!file.type?.startsWith('image/')) { setErr('Please select an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setErr('Max size is 8MB.'); return; }
    setSelectedFile(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage('Please select a file to upload.');
      setErr('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setMessage('Uploading...');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('imageType', imageType);
    formData.append('condition', condition);

    try {
      // ✔ choose the right API
      if (imageType === 'BASELINE') {
        await uploadBaselineImage(transformerId, formData);
      } else {
        // NOTE: if your backend expects inspectionId for thermal uploads,
        // pass inspectionId (prop) here. If you don’t have one on this page,
        // show an error and stop to avoid 404.
        if (!inspectionId) {
          setErr('Select an inspection to upload a maintenance image.');
          setIsUploading(false);
          setMessage('');
          return;
        }
        await uploadThermalImage(inspectionId, formData);
      }

      setOk('File uploaded successfully!');
      setMessage('File uploaded successfully!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setErr('File upload failed. Please try again.');
      setMessage('File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-body">
        <h5 className="card-title">Upload New Thermal Image</h5>

        {/* (optional) preview block — remove if you don’t want preview */}
        {previewUrl && (
          <div className="mb-3">
            <ZoomableImage src={previewUrl} alt="Preview" style={{ height: 300 }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="fileInput" className="form-label">Thermal Image</label>
            <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} required />
            <div className="form-text">JPEG/PNG, max 8MB.</div>
          </div>

          <div className="mb-3">
            <label htmlFor="imageTypeSelect" className="form-label">Image Type</label>
            <select id="imageTypeSelect" className="form-select" value={imageType} onChange={(e) => setImageType(e.target.value)}>
              <option value="BASELINE">Baseline</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {imageType === 'BASELINE' && (
            <div className="mb-3">
              <label htmlFor="conditionSelect" className="form-label">Environmental Condition</label>
              <select id="conditionSelect" className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="SUNNY">Sunny</option>
                <option value="CLOUDY">Cloudy</option>
                <option value="RAINY">Rainy</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {message && <div className="alert alert-info mt-3">{message}</div>}
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default ImageUploadForm;
