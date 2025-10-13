import React, { useMemo, useState } from 'react';
import { uploadThermalImage, uploadBaselineImage } from '../services/apiService'; 
import Toast from '../components/Toast';           
import ZoomableImage from '../components/ZoomableImage'; // Custom component for image preview (if used)

/**
 * Universal component for uploading either a Baseline image (linked to TransformerId) 
 * or a Maintenance image (linked to InspectionId). Handles file validation and API calls.
 * * @param {number} transformerId - The ID of the transformer being updated.
 * @param {number} inspectionId - The ID of the inspection (required for MAINTENANCE upload).
 */
const ImageUploadForm = ({ transformerId, inspectionId }) => {
  // --- State Management ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageType, setImageType] = useState('BASELINE'); // Controls conditional fields
  const [condition, setCondition] = useState('SUNNY');    // Environmental condition metadata
  const [message, setMessage] = useState('');      
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState(null);       

  // Custom toast handlers
  const setOk = (m) => setToast({ type: 'success', message: m });
  const setErr = (m) => setToast({ type: 'error', message: m });

  // Memoized URL for local image preview
  const previewUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : null), [selectedFile]);

  /**
   * Handles file selection and client-side validation (type and size).
   */
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) { setSelectedFile(null); return; }
    if (!file.type?.startsWith('image/')) { setErr('Please select an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setErr('Max size is 8MB.'); return; } // Max size check
    setSelectedFile(file);
  };

  /**
   * Constructs the FormData payload and calls the appropriate backend API.
   */
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
      // --- Conditional API Routing ---
      if (imageType === 'BASELINE') {
        // Uses the dedicated Baseline upload API
        await uploadBaselineImage(transformerId, formData);
      } else {
        // Maintenance upload requires a valid inspection ID
        if (!inspectionId) {
          setErr('Select an inspection to upload a maintenance image.');
          setIsUploading(false);
          setMessage('');
          return;
        }
        // Uses the dedicated Thermal/Maintenance upload API
        await uploadThermalImage(inspectionId, formData);
      }
      
      setOk('File uploaded successfully!');
      setMessage('File uploaded successfully!');
      setSelectedFile(null); // Clear input field visually
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

        {/* Client-side Image Preview */}
        {previewUrl && (
          <div className="mb-3">
            {/* Using custom ZoomableImage for an interactive preview */}
            <ZoomableImage src={previewUrl} alt="Preview" style={{ height: 300 }} />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* File Input */}
          <div className="mb-3">
            <label htmlFor="fileInput" className="form-label">Thermal Image</label>
            <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} required />
            <div className="form-text">JPEG/PNG, max 8MB.</div>
          </div>

          {/* Image Type Selection (Controls visibility of Condition field) */}
          <div className="mb-3">
            <label htmlFor="imageTypeSelect" className="form-label">Image Type</label>
            <select id="imageTypeSelect" className="form-select" value={imageType} onChange={(e) => setImageType(e.target.value)}>
              <option value="BASELINE">Baseline</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Environmental Condition (Only shown for Baseline uploads) */}
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

          {/* Submission Button */}
          <button type="submit" className="btn btn-primary" disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {message && <div className="alert alert-info mt-3">{message}</div>}
        
        {/* Global Toast Notification */}
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default ImageUploadForm;