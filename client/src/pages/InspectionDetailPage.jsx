import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionById } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import { Card, Row, Col, ListGroup } from 'react-bootstrap';

const InspectionDetailPage = () => {
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInspectionDetails = async () => {
        try {
            setLoading(true);
            const response = await getInspectionById(inspectionId);
            setInspection(response.data);
            console.log('*************************************')
             console.log('API Response Data:', response.data);
        } catch (err) {
            setError('Failed to fetch inspection details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInspectionDetails();
    }, [inspectionId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    const hasThermalImage = inspection.thermalImages && inspection.thermalImages.length > 0;
    const thermalImage = hasThermalImage ? inspection.thermalImages[0] : null;
    const hasBaselineImage = inspection.transformerBaselineImageName;

    // Construct the image URLs
    const baselineImageUrl = `http://localhost:8080/api/transformers/${inspection.transformerDbId}/baseline-image/view`;
    const thermalImageUrl = hasThermalImage ? `http://localhost:8080/files/${thermalImage.fileName}` : '';

    return (
        <div className="container-fluid">
            <Card className="mb-4"><Card.Body><Card.Title>Details for Inspection No: {inspection.inspectionNo}</Card.Title><Card.Text><strong>Status:</strong> {inspection.status}</Card.Text></Card.Body></Card>

            {/* --- Conditional Logic for Thermal Image Section --- */}
            {hasThermalImage ? (
                // If an image is uploaded, show the Comparison View
                <Card className="rounded-4 shadow-sm">
                    <Card.Body>
                        <h4>Thermal Image Comparison</h4>
                        <Row>
                            {/* Left Side: Baseline Image */}
                            <Col md={6}>
                                <Card>
                                    <Card.Header>Baseline</Card.Header>
                                    <Card.Body className="text-center">
                                        {hasBaselineImage ? (
                                            <img src={baselineImageUrl} alt="Baseline" style={{ maxWidth: '100%', height: 'auto' }} />
                                        ) : (
                                            <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}>
                                                <p className="text-muted">Please upload a baseline image for comparison.</p>
                                            </div>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                            {/* Right Side: Current Thermal Image */}
                            <Col md={6}>
                                <Card>
                                     <Card.Header>Current</Card.Header>
                                    <Card.Body>
                                        <img src={thermalImageUrl} alt="Current Thermal" style={{ maxWidth: '100%', height: 'auto' }} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            ) : (
                // Otherwise, show the Upload Form
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <ThermalImageUpload
                            transformerId={inspection.transformerBusinessId}
                            onUploadSuccess={fetchInspectionDetails}
                        />
                    </Card.Body>
                </Card>
            )}
        </div>
    );
};

export default InspectionDetailPage;