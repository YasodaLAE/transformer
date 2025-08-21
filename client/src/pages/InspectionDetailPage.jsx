import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInspectionById, deleteThermalImage, deleteBaselineImage } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { Card, Row, Col, Button } from 'react-bootstrap';

const InspectionDetailPage = () => {
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);

    const fetchInspectionDetails = async () => {
        try {
            setLoading(true);
            const response = await getInspectionById(inspectionId);
            setInspection(response.data);
        } catch (err) {
            setError('Failed to fetch inspection details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspectionDetails();
    }, [inspectionId]);

    const handleDelete = async (imageId) => {
        if (window.confirm("Are you sure you want to delete this thermal image?")) {
            try {
                await deleteThermalImage(imageId);
                fetchInspectionDetails();
            } catch (err) {
                console.error("Failed to delete image:", err);
                alert("Failed to delete image.");
            }
        }
    };

    const handleDeleteBaseline = async (transformerId) => {
        if (window.confirm("Are you sure you want to delete the baseline image?")) {
            try {
                await deleteBaselineImage(transformerId);
                fetchInspectionDetails();
            } catch (err) {
                console.error("Failed to delete baseline image:", err);
                alert("Failed to delete baseline image.");
            }
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    const hasThermalImage = inspection.thermalImage;
    const thermalImage = inspection.thermalImage;
    const hasBaselineImage = inspection.transformerBaselineImageName;

    const baselineImageUrl = `http://localhost:8080/api/transformers/${inspection.transformerDbId}/baseline-image/view?timestamp=${new Date().getTime()}`;
    const thermalImageUrl = hasThermalImage ? `http://localhost:8080/files/${thermalImage.fileName}` : '';

    return (
        <div className="container-fluid">
            <Card className="mb-4"><Card.Body><Card.Title>Details for Inspection No: {inspection.inspectionNo}</Card.Title></Card.Body></Card>

            {hasThermalImage ? (
                <Card className="rounded-4 shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                             <h4>Thermal Image Comparison</h4>
                        </div>
                        <Row>
                            <Col md={6}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        Baseline
                                        {hasBaselineImage && (<Button variant="outline-danger" size="sm" onClick={() => handleDeleteBaseline(inspection.transformerDbId)}>Delete</Button>)}
                                    </Card.Header>
                                    <Card.Body className="text-center">
                                        {hasBaselineImage ? (<img src={baselineImageUrl} alt="Baseline" style={{ maxWidth: '100%' }} />) : (<div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}><p className="text-muted">No baseline image available.</p></div>)}
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md={6}>
                                <Card>
                                    <Card.Header className="d-flex justify-content-between align-items-center">
                                        Current
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(thermalImage.id)}>Delete</Button>
                                    </Card.Header>
                                    <Card.Body><img src={thermalImageUrl} alt="Current Thermal" style={{ maxWidth: '100%' }} /></Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ) : (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <ThermalImageUpload
                            inspectionId={inspection.id}
                            onUploadSuccess={fetchInspectionDetails}
                        />
                    </Card.Body>
                </Card>
            )}

            {/* --- UPDATED SECTION --- */}
            {/* The button and the modal it controls are now inside the same conditional block */}
            {hasThermalImage && !hasBaselineImage && (
                <>
                    <Card className="mt-4">
                        <Card.Body>
                            <p>A baseline image is required for a full comparison.</p>
                            <BaselineImageUploader
                                                    show={showBaselineModal}
                                                    handleClose={() => setShowBaselineModal(false)}
                                                    onUploadSuccess={fetchInspectionDetails}
                                                    transformerId={inspection.transformerDbId}
                                                />
                        </Card.Body>
                    </Card>


                </>
            )}
        </div>
    );
};

export default InspectionDetailPage;