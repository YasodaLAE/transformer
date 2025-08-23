import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer, createInspection, getTransformerById, deleteBaselineImage, deleteInspection } from '../services/apiService';
import { Button, Card, Row, Col } from 'react-bootstrap';
import AddInspectionModal from '../components/AddInspectionModal';
import InspectionTable from '../components/InspectionTable';
import { useAuth } from '../hooks/AuthContext';
import BaselineImageUploader from '../components/BaselineImageUploader';
import ThermalImageUpload from '../components/ThermalImageUpload';
import { getAllTransformers } from '../services/apiService';

const InspectionPage = () => {
    const { transformerId } = useParams();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false); // Changed name to be more generic
    const [inspectionToEdit, setInspectionToEdit] = useState(null); // New state for editing
    const { isAdmin } = useAuth();
    const [transformer, setTransformer] = useState(null);
    const [baselineImageName, setBaselineImageName] = useState(null);
    const [allTransformers, setAllTransformers] = useState([]);

    const fetchInspections = useCallback(async () => {
        try {
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
    }, [transformerId]);

    useEffect(() => {
        fetchInspections();
    }, [fetchInspections]);

    // Handle opening the modal in "add" mode
    const handleOpenAddModal = () => {
        setInspectionToEdit(null); // Set to null to trigger "add" mode in the modal
        setShowModal(true);
    };

    // Handle opening the modal in "edit" mode
    const handleOpenEditModal = (inspection) => {
        setInspectionToEdit(inspection); // Set the inspection to edit
        setShowModal(true);
    };

    // Handle closing the modal and refreshing data
    const handleCloseModal = () => {
        setShowModal(false);
        setInspectionToEdit(null); // Reset the state
        fetchInspections(); // Re-fetch the data to ensure the list is up-to-date
    };

    const handleDelete = async (inspectionId) => {
        if (window.confirm('Are you sure you want to delete this inspection?')) {
            try {
                await deleteInspection(inspectionId);
                setInspections(inspections.filter(inspection => inspection.id !== inspectionId));
            } catch (error) {
                console.error('Failed to delete inspection:', error);
                setError('Failed to delete inspection. Please try again.');
            }
        }
    };

    const handleBaselineUploadSuccess = (fileName) => {
        setBaselineImageName(fileName);
    };

    const handleViewBaselineImage = () => {
        const imageUrl = `http://localhost:8080/api/transformers/${transformerId}/baseline-image/view`;
        window.open(imageUrl, '_blank');
    };

    const handleDeleteBaselineImage = async () => {
        if (window.confirm("Are you sure you want to delete this baseline image?")) {
            try {
                await deleteBaselineImage(transformerId);
                setBaselineImageName(null);
                alert("Baseline image deleted successfully!");
            } catch (error) {
                console.error("Failed to delete baseline image:", error);
                alert("Failed to delete baseline image. Please try again.");
            }
        }
    };

    if (loading) {
        return <p>Loading inspections...</p>;
    }

    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <div className="container-fluid">
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
                                {isAdmin && !baselineImageName && (
                                    <BaselineImageUploader
                                        transformerId={transformerId}
                                        onUploadSuccess={handleBaselineUploadSuccess}
                                    />
                                )}
                                {baselineImageName && (
                                    <small className="text-muted mt-2 d-flex align-items-center">
                                        Baseline:
                                        <span className="text-primary ms-2 me-2">{baselineImageName}</span>
                                        <div className="d-flex align-items-center">
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={handleViewBaselineImage}
                                                className="me-2 d-flex align-items-center py-1 px-2"
                                                title="View Baseline Image"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </Button>
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

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformer Inspections</h2>
                {isAdmin && (
                    <Button onClick={handleOpenAddModal}>Add Inspection</Button>
                )}
            </div>
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={inspections}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal} // Pass the new onEdit handler
                    showTransformerColumn={false}
                />
            ) : (
                <p>No inspections found for this transformer.</p>
            )}
            <AddInspectionModal
                show={showModal}
                handleClose={handleCloseModal}
                onInspectionAdded={fetchInspections}
                transformerId={transformerId}
                inspectionToEdit={inspectionToEdit}
                allTransformers={allTransformers}
            />
        </div>
    );
};

export default InspectionPage;