// // src/components/ImageUploadForm.jsx
// import React, { useState } from 'react';
// import { uploadThermalImage } from '../services/apiService';
//
// const ImageUploadForm = ({ transformerId }) => {
//     const [transformerId, setTransformerId] = useState(null);
//     const = useState('BASELINE');
//     const [condition, setCondition] = useState('SUNNY');
//     const [message, setMessage] = useState('');
//     const [isUploading, setIsUploading] = useState(false);
//
//     const handleFileChange = (event) => {
//         setSelectedFile(event.target.files);
//     };
//
//     const handleSubmit = async (event) => {
//         event.preventDefault();
//         if (!selectedFile) {
//             setMessage('Please select a file to upload.');
//             return;
//         }
//
//         setIsUploading(true);
//         setMessage('Uploading...');
//
//         const formData = new FormData();
//         formData.append('file', selectedFile);
//         formData.append('imageType', imageType);
//         formData.append('condition', condition);
//
//         try {
//             await uploadImage(transformerId, formData);
//             setMessage('File uploaded successfully!');
//         } catch (error) {
//             setMessage('File upload failed. Please try again.');
//             console.error('Upload error:', error);
//         } finally {
//             setIsUploading(false);
//         }
//     };
//
//     return (
//         <div className="card mt-4">
//             <div className="card-body">
//                 <h5 className="card-title">Upload New Thermal Image</h5>
//                 <form onSubmit={handleSubmit}>
//                     <div className="mb-3">
//                         <label htmlFor="fileInput" className="form-label">Thermal Image</label>
//                         <input type="file" className="form-control" id="fileInput" onChange={handleFileChange} required />
//                     </div>
//                     <div className="mb-3">
//                         <label htmlFor="imageTypeSelect" className="form-label">Image Type</label>
//                         <select id="imageTypeSelect" className="form-select" value={imageType} onChange={(e) => setImageType(e.target.value)}>
//                             <option value="BASELINE">Baseline</option>
//                             <option value="MAINTENANCE">Maintenance</option>
//                         </select>
//                     </div>
//                     {imageType === 'BASELINE' && (
//                         <div className="mb-3">
//                             <label htmlFor="conditionSelect" className="form-label">Environmental Condition</label>
//                             <select id="conditionSelect" className="form-select" value={condition} onChange={(e) => setCondition(e.target.value)}>
//                                 <option value="SUNNY">Sunny</option>
//                                 <option value="CLOUDY">Cloudy</option>
//                                 <option value="RAINY">Rainy</option>
//                             </select>
//                         </div>
//                     )}
//                     <button type="submit" className="btn btn-primary" disabled={isUploading}>
//                         {isUploading? 'Uploading...' : 'Upload'}
//                     </button>
//                 </form>
//                 {message && <div className="alert alert-info mt-3">{message}</div>}
//             </div>
//         </div>
//     );
// };
//
// export default ImageUploadForm;

import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { uploadBaselineImage } from '../services/apiService'; // Use the correct API function

// Rename the component to be more specific
const BaselineImageUploader = ({ show, handleClose, onUploadSuccess, transformerId }) => {
    const [file, setFile] = useState(null);
    const [condition, setCondition] = useState('Sunny');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setError('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('condition', condition);
        formData.append('uploader', user.username); // Placeholder

        setIsLoading(true);
        setError('');

        try {
            // Call the correct function
            await uploadBaselineImage(transformerId, formData);
            onUploadSuccess(); // Refresh parent component
            handleClose();     // Close the modal
        } catch (err) {
            setError('Upload failed. Please try again.');
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
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Environmental Condition</Form.Label>
                        <Form.Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                            <option>-- Select Condition --</option>
                            <option value="Sunny">Sunny</option>
                            <option value="Cloudy">Cloudy</option>
                            <option value="Rainy">Rainy</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Image File</Form.Label>
                        <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                    </Form.Group>
                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={handleClose} className="me-2">Cancel</Button>
                        <Button variant="primary" type="submit" disabled={isLoading}>
                            {isLoading ? <Spinner size="sm" /> : 'Upload'}
                        </Button>
                    </div>
                    {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                </Modal.Body>
        </Modal>
    );
};

export default BaselineImageUploader;