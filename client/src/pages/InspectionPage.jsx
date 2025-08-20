import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer, createInspection, getTransformerById, deleteBaselineImage } from '../services/apiService';
import { Button, Card, Row, Col } from 'react-bootstrap';
import AddInspectionModal from '../components/AddInspectionModal';
import InspectionTable from '../components/InspectionTable';
import { useAuth } from '../hooks/AuthContext'; // Import the useAuth hook
import BaselineImageUploader from '../components/BaselineImageUploader';
import ThermalImageUpload from '../components/ThermalImageUpload'; // Adjust the path if necessary

const InspectionPage = () => {
    const { transformerId } = useParams();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const { isAdmin, login, logout } = useAuth();
    const [transformer, setTransformer] = useState(null);
    const [baselineImageName, setBaselineImageName] = useState(null); // New state for the filename

    const fetchInspections = useCallback(async () => {
        try {
            const [inspectionsResponse, transformerResponse] = await Promise.all([
                            getInspectionsByTransformer(transformerId),
                            getTransformerById(transformerId)
                        ]);

                        setInspections(inspectionsResponse.data);
                        setTransformer(transformerResponse.data);
                        setBaselineImageName(transformerResponse.data.baselineImageName);
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

    const handleInspectionAdded = () => {
        // After an inspection is added, re-fetch the list to update the table
        fetchInspections();
        setShowAddModal(false);
    };

    const handleBaselineUploadSuccess = (fileName) => {
            setBaselineImageName(fileName);
    };

    const handleViewBaselineImage = () => {
            // Construct the URL to the image on the server
            const imageUrl = `http://localhost:8080/api/transformers/${transformerId}/baseline-image/view`;
            window.open(imageUrl, '_blank'); // Open in a new tab
        };

    const handleDeleteBaselineImage = async () => {
        if (window.confirm("Are you sure you want to delete this baseline image?")) {
            try {
                await deleteBaselineImage(transformerId);
                // On success, reset the baseline image name state
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
                            {/* New upload component in the top-right corner */}
                            <div className="d-flex flex-column align-items-end">
                                {/* Only show the uploader button if the user is an admin AND a baseline image has NOT been uploaded */}
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
                                            {/* View button (eye icon) */}
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={handleViewBaselineImage}
                                                className="me-2 d-flex align-items-center py-1 px-2"
                                                title="View Baseline Image"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </Button>
                                            {/* Delete button (trash bin icon) */}
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={handleDeleteBaselineImage}
                                                className="d-flex align-items-center py-1 px-2"
                                                title="Delete Baseline Image"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
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
                                <small className="text-muted">Capacity</small>
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
                {isAdmin ? (
                    <>
                <Button onClick={() => setShowAddModal(true)}>Add Inspection</Button>
                </>
                ) : (<p> </p> )}

            </div>
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={inspections}
                    onInspectionDeleted={fetchInspections}
                />

            ) : (
                <p>No inspections found for this transformer.</p>
            )}
            <AddInspectionModal
                show={showAddModal}
                handleClose={() => setShowAddModal(false)}
                onInspectionAdded={handleInspectionAdded}
                transformerId={transformerId}
            />
        </div>
    );
};

export default InspectionPage;