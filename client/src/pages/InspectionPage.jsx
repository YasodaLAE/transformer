import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer, createInspection, getTransformerById, deleteBaselineImage, deleteInspection } from '../services/apiService';
import { Button, Card, Row, Col } from 'react-bootstrap';
import AddInspectionModal from '../components/AddInspectionModal';
import InspectionTable from '../components/InspectionTable';
import { useAuth } from '../hooks/AuthContext';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { getAllTransformers } from '../services/apiService'; // Needed for the AddInspectionModal dropdown
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';


/**
 * Renders the page for a specific Transformer ID, showing the transformer's details
 * and a list of all associated inspections.
 */
const InspectionPage = () => {
    // Hooks and State
    const { transformerId } = useParams(); // Retrieves ID from the URL
    const [inspections, setInspections] = useState([]);
    const [transformer, setTransformer] = useState(null);
    const [allTransformers, setAllTransformers] = useState([]); // List for the modal dropdown
    const [baselineImageName, setBaselineImageName] = useState(null);

    // UI/Flow State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [inspectionToEdit, setInspectionToEdit] = useState(null);

    // Auth and Notification
    const { isAdmin } = useAuth();
    const [toast, setToast] = useState(null);
    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });


    /**
     * Fetches all necessary data concurrently: inspections for this transformer,
     * the transformer details, and the list of all transformers (for the modal).
     */
    const fetchInspections = useCallback(async () => {
        try {
            // Fetch multiple data points in parallel for efficiency
            const [inspectionsResponse, transformerResponse, allTransformersResponse] = await Promise.all([
                            getInspectionsByTransformer(transformerId),
                            getTransformerById(transformerId),
                            getAllTransformers()
                        ]);
            setInspections(inspectionsResponse.data);
            setTransformer(transformerResponse.data);
            setBaselineImageName(transformerResponse.data.baselineImageName);
            setAllTransformers(allTransformersResponse.data);
            setLoading(false);
            setError(null);
        } catch (err) {
            setError('Failed to fetch inspections.');
            setLoading(false);
            console.error(err);
        }
    }, [transformerId]); // Dependency on transformerId ensures re-fetch if ID changes

    // Run data fetching on component mount
    useEffect(() => {
        fetchInspections();
    }, [fetchInspections]);

    // Handle opening the modal in "add" mode
    const handleOpenAddModal = () => {
        setInspectionToEdit(null); // Clear editing state
        setShowModal(true);
    };

    // Handle opening the modal in "edit" mode
    const handleOpenEditModal = (inspection) => {
        setInspectionToEdit(inspection);
        setShowModal(true);
    };

    // Handle closing the modal and triggering a full data refresh
    const handleCloseModal = () => {
        setShowModal(false);
        setInspectionToEdit(null);
        fetchInspections();
    };

    // Updates state after a successful baseline image upload
    const handleBaselineUploadSuccess = (fileName) => {
        setBaselineImageName(fileName);
        fetchInspections(); // Re-fetch to ensure all associated data is updated
    };

    // Opens the baseline image in a new tab
    const handleViewBaselineImage = () => {
        const imageUrl = `http://localhost:8080/api/transformers/${transformerId}/baseline-image/view`;
        window.open(imageUrl, '_blank');
    };

    /**
     * Handles deletion of an inspection record.
     */
    const handleDelete = async (inspectionId) => {
      if (window.confirm('Are you sure you want to delete this inspection?')) {
        try {
          await deleteInspection(inspectionId);
          // Optimistically remove item from local state
          setInspections(inspections.filter(i => i.id !== inspectionId));
          showOk('Inspection deleted');
        } catch (error) {
          console.error('Failed to delete inspection:', error);
          showErr('Failed to delete inspection');
        }
      }
    };

    /**
     * Handles deletion of the transformer's baseline image.
     */
    const handleDeleteBaselineImage = async () => {
      if (window.confirm("Delete this baseline image?")) {
        try {
          await deleteBaselineImage(transformerId);
          setBaselineImageName(null);
          showOk('Baseline image deleted');
          fetchInspections();
        } catch (err) {
          console.error("Failed to delete baseline image:", err);
          showErr('Failed to delete baseline image');
        }
      }
    };


    if (loading) return <Spinner label="Loading inspections..." />;


    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <div className="container-fluid">
            {/* --- Transformer Details Card --- */}
            {transformer && (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex flex-column">
                                <h3 className="fw-bold">{transformer.transformerId}</h3>
                                <div className="d-flex align-items-center mt-1">
                                    <span className="text-muted me-2">{transformer.region}</span>
                                    <span className="text-primary me-1">📍</span>
                                    <span className="text-muted">{transformer.details}</span>
                                </div>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                                {/* Baseline Uploader Button (Admin only, if no image exists) */}
                                {isAdmin && !baselineImageName && (
                                    <BaselineImageUploader
                                        transformerId={transformerId}
                                        onUploadSuccess={handleBaselineUploadSuccess}
                                    />
                                )}
                                {/* Baseline Image Info and Actions */}
                                {baselineImageName && (
                                    <small className="text-muted mt-2 d-flex align-items-center">
                                        Baseline:
                                        <span className="text-primary ms-2 me-2">{baselineImageName}</span>
                                        <div className="d-flex align-items-center">
                                            {/* View Button */}
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={handleViewBaselineImage}
                                                className="me-2 d-flex align-items-center py-1 px-2"
                                                title="View Baseline Image"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </Button>
                                            {/* Delete Button (Admin only) */}
                                            {isAdmin && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={handleDeleteBaselineImage}
                                                className="d-flex align-items-center py-1 px-2"
                                                title="Delete Baseline Image"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button> )}
                                        </div>
                                    </small>
                                )}
                            </div>
                        </div>
                        {/* Summary Details Row */}
                        <Row className="text-center">
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.poleId}</h6>
                                <small className="text-muted">Pole No</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.capacity || 'N/A'}</h6>
                                <small className="text-muted">Capacity (kVA)</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.transformerType}</h6>
                                <small className="text-muted">Type</small>
                            </Col>
                            <Col className="py-2">
                                <h6 className="mb-0 fw-bold">{transformer.noOfFeeders || 'N/A'}</h6>
                                <small className="text-muted">No. of Feeders</small>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* --- Inspection List Section --- */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformer Inspections</h2>
                {isAdmin && (
                    <Button onClick={handleOpenAddModal}>Add Inspection</Button>
                )}
            </div>

            {/* Inspection Table Rendering */}
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={inspections}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                    showTransformerColumn={false} // Hide Transformer column since it's implied by the page context
                />
            ) : (
                <p>No inspections found for this transformer.</p>
            )}

            {/* Modal for Adding/Editing Inspections */}
            <AddInspectionModal
              show={showModal}
              handleClose={handleCloseModal}
              onInspectionAdded={(mode) => {
                if (mode === 'created') showOk('Inspection created successfully!');
                else if (mode === 'updated') showOk('Inspection updated successfully!');
                fetchInspections();
              }}
              transformerId={transformerId} // Pass the ID so the modal defaults to this transformer
              inspectionToEdit={inspectionToEdit}
              allTransformers={allTransformers}
            />

            {/* Global Toast Notification */}
             {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default InspectionPage;