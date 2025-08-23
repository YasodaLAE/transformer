import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionById, deleteThermalImage, deleteBaselineImage, getTransformerById } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';

const InspectionDetailPage = () => {
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [baselineImageName, setBaselineImageName] = useState(null);
    const { user, isAdmin } = useAuth();

    const fetchData = async () => {
        try {
            setLoading(true);
            const inspectionResponse = await getInspectionById(inspectionId);
            setInspection(inspectionResponse.data);

            if (inspectionResponse.data.transformerDbId) {
                const transformerResponse = await getTransformerById(inspectionResponse.data.transformerDbId);
                setTransformer(transformerResponse.data);
                setBaselineImageName(transformerResponse.data.baselineImageName);
            }
        
        } catch (err) {
            setError('Failed to fetch inspection details.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [inspectionId]);

    const handleDelete = async (imageId) => {
        if (confirm("Are you sure you want to delete this thermal image?")) {
            try {
                await deleteThermalImage(imageId);
                fetchData();
            } catch (err) {
                console.error("Failed to delete image:", err);
                alert("Failed to delete image.");
            }
        }
    };

    const handleDeleteBaseline = async (transformerId) => {
        if (confirm("Are you sure you want to delete the baseline image?")) {
            try {
                await deleteBaselineImage(transformerId);
                fetchData();
            } catch (err) {
                console.error("Failed to delete baseline image:", err);
                alert("Failed to delete baseline image.");
            }
        }
    };

    const handleViewBaselineImage = () => {
        if (transformer) {
            const imageUrl = `http://localhost:8080/api/transformers/${transformer.id}/baseline-image/view`;
            window.open(imageUrl, "_blank");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    const hasThermalImage = inspection.thermalImage;
    const thermalImage = inspection.thermalImage;
    const hasBaselineImage = transformer && transformer.baselineImageName;

    const baselineImageUrl = hasBaselineImage
        ? `http://localhost:8080/api/transformers/${transformer.id}/baseline-image/view?timestamp=${new Date().getTime()}`
        : '';
    const thermalImageUrl = hasThermalImage ? `http://localhost:8080/files/${thermalImage.fileName}` : '';

    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'bg-primary';
            case 'in progress':
                return 'bg-success';
            case 'pending':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <div className="container-fluid">
            {transformer && (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        {/* Unified Header with Flexbox */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            {/* Left side: Inspection Details */}
                            <div className="d-flex flex-column">
                                <h3 className="fw-bold">{inspection.inspectionNo}</h3>
                                <div className="d-flex align-items-center mt-1">
{/*                                     <small className="text-muted mt-2 d-flex align-items-center"> */}
{/*                                         Last updated: */}
{/*                                         <span className="text-primary ms-2"> */}
{/*                                             {inspection.lastUpdated ? new Date(inspection.lastUpdated).toLocaleString() : 'N/A'} */}
{/*                                         </span> */}
{/*                                     </small> */}
                                </div>
                            </div>
                            {/* Right side: Status and Baseline Image Section */}
                            <div className="d-flex flex-column align-items-end">
                                <div className={`badge rounded-pill text-white ${getStatusBadgeColor(inspection.status)} mb-2`}>
                                    {inspection.status}
                                </div>
                                {isAdmin && !hasBaselineImage && (
                                    <BaselineImageUploader
                                        transformerId={transformer.id}
                                        onUploadSuccess={fetchData}
                                    />
                                )}
                                {hasBaselineImage && (
                                    <small className="text-muted mt-2 d-flex align-items-center">
                                        Baseline:
                                        <span className="text-primary ms-2 me-2">{baselineImageName}</span>
                                        <div className="d-flex align-items-center ms-2">
                                            {/* View button */}
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={handleViewBaselineImage}
                                                className="me-2 d-flex align-items-center py-1 px-2"
                                                title="View Baseline Image"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </Button>
                                            {/* Delete button */}
                                            {isAdmin && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleDeleteBaseline(transformer.id)}
                                                className="d-flex align-items-center py-1 px-2"
                                                title="Delete Baseline Image"
                                            >
                                                <i className="bi bi-trash-fill"></i>
                                            </Button>
                                            )}
                                        </div>
                                    </small>
                                )}
                            </div>
                        </div>

                        {/* Summary Details Row */}
                        <Row className="text-center">
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer ? transformer.transformerId : inspection.transformerNo}</h6>
                                <small className="text-muted">Transformer No</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer ? transformer.poleId : inspection.poleNo}</h6>
                                <small className="text-muted">Pole No</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer ? transformer.region : inspection.branch}</h6>
                                <small className="text-muted">Branch</small>
                            </Col>
                            <Col className="py-2">
                                <h6 className="mb-0 fw-bold">{inspection.inspectedBy}</h6>
                                <small className="text-muted">Inspected By</small>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            {/* Thermal Image Comparison Section */}
            {hasThermalImage ? (
                <>
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
                                            {isAdmin && hasBaselineImage && (
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteBaseline(transformer.id)}>Delete</Button>
                                            )}
                                        </Card.Header>
                                        <Card.Body className="text-center">
                                            {hasBaselineImage ? (
                                                <img src={baselineImageUrl} alt="Baseline" style={{ maxWidth: '100%' }} />
                                            ) : (
                                                <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}>
                                                    <p className="text-muted">No baseline image available.</p>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card>
                                        <Card.Header className="d-flex justify-content-between align-items-center">
                                            Current
                                            {isAdmin && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(thermalImage.id)}>Delete</Button>
                                            )}
                                        </Card.Header>
                                        <Card.Body>
                                            <img src={thermalImageUrl} alt="Current Thermal" style={{ maxWidth: '100%' }} />
                                        </Card.Body>
                                    </Card>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

{/*                     {!hasBaselineImage && ( */}
{/*                         <Card className="mt-4 rounded-4 shadow-sm"> */}
{/*                             <Card.Body> */}
{/*                                 <p>A baseline image is required for a full comparison.</p> */}
{/*                                 <BaselineImageUploader */}
{/*                                     show={showBaselineModal} */}
{/*                                     handleClose={() => setShowBaselineModal(false)} */}
{/*                                     onUploadSuccess={fetchData} */}
{/*                                     transformerId={inspection.transformerDbId} */}
{/*                                 /> */}
{/*                             </Card.Body> */}
{/*                         </Card> */}
{/*                     )} */}
                </>
            ) : (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        {isAdmin ? (
                        <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={fetchData} />
                        ) : (
                            <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}>
                                <p className="text-muted text-center">No thermal images uploaded yet.</p>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default InspectionDetailPage;