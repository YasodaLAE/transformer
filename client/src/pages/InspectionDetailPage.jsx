import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionById, deleteThermalImage, deleteBaselineImage, getTransformerById, getAnomalyDetectionResult, triggerAnomalyDetection } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { Card, Row, Col, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';

const InspectionDetailPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [baselineImageName, setBaselineImageName] = useState(null);
    const { user, isAdmin } = useAuth();
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false); // To show spinner/disable buttons
    const [timestamp, setTimestamp] = useState(Date.now());
    const detectionTriggeredRef = useRef(false);

    // Function to fetch the existing anomaly result if it exists
    const fetchAnomalyResult = async (id) => {
        try {
            const resultResponse = await getAnomalyDetectionResult(id); // Using the service function (or axios.get)
            setAnomalyResult(resultResponse.data);
        } catch (err) {
            // 404 is expected if detection hasn't run or result wasn't saved.
            if (err.response && err.response.status === 404) {
                setAnomalyResult(null);
            } else {
                console.error('Failed to fetch anomaly result:', err);
            }
        }
    };

    // Function to run the detection and fetch the result (POST then GET)
    const runAndFetchDetection = async (id) => {
        setIsDetecting(true);
        setAnomalyResult(null); // Clear previous results

        try {
            // 1. POST: Trigger the detection script
            const postResponse = await triggerAnomalyDetection(id);

                                 // 2. SET: Use the result directly from the POST response
                                 // ASSUMES your Spring Boot POST returns the saved AnomalyDetectionResult entity
            setAnomalyResult(postResponse.data); // <-- Use POST response data directly

            // Optionally, force refresh the component to update the image source
            // (by changing the URL query parameter)
            setTimestamp(new Date().getTime());

        } catch (error) {
            console.error('Detection failed:', error.response ? error.response.data : error.message);
            alert('Anomaly detection failed. Check server logs.');
        } finally {
            setIsDetecting(false);
        }
    };
    // Add a timestamp state to force image refresh


//     const fetchData = async () => {
//         try {
//             setLoading(true);
//             const inspectionResponse = await getInspectionById(inspectionId);
//             setInspection(inspectionResponse.data);
//
//             if (inspectionResponse.data.transformerDbId) {
//                 const transformerResponse = await getTransformerById(inspectionResponse.data.transformerDbId);
//                 setTransformer(transformerResponse.data);
//                 setBaselineImageName(transformerResponse.data.baselineImageName);
//             }
//
//             //if (inspectionResponse.data.thermalImage) {
//             //    await fetchAnomalyResult(inspectionId);
//             //} else {
//             //    setAnomalyResult(null);
//             //}
//
//             if (inspectionResponse.data.thermalImage) {
//                 // A. Attempt to fetch existing result
//                 try {
//                     await fetchAnomalyResult(inspectionId);
//                     // If fetchAnomalyResult succeeds, anomalyResult is set, we're done.
//                 } catch (err) {
//                     // B. If fetchAnomalyResult (GET /anomalies) returns 404 (as expected if no result saved yet)
//                     if (err.response && err.response.status === 404) {
//                         setAnomalyResult(null); // Explicitly clear any stale state
//
//                         // C. NOW: Check if we have an image but no result, and trigger the detection
//                         if (inspectionResponse.data.thermalImage && !anomalyResult) {
//                             console.log("No existing anomaly result found. Triggering detection...");
//                             // This will POST to /detect-anomalies and save the result
//                             await runAndFetchDetection(inspectionId);
//                         }
//                     } else {
//                         console.error('Failed to fetch anomaly result:', err);
//                     }
//                 }
//             } else {
//                 setAnomalyResult(null);
//             }
//
//
//         } catch (err) {
//             setError('Failed to fetch inspection details.');
//             console.error(err);
//         } finally {
//             setLoading(false);
//         }
//     };

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

            // --- ANOMALY CHECK LOGIC ---
            if (inspectionResponse.data.thermalImage) {
                try {
                    // A. Attempt to fetch existing result directly
                    const resultResponse = await getAnomalyDetectionResult(inspectionId);
                    setAnomalyResult(resultResponse.data); // Result found, update state.
                    detectionTriggeredRef.current = true;

                } catch (err) {
                    // B. Result was NOT found (404 caught here)
                    if (err.response && err.response.status === 404) {
                        setAnomalyResult(null);

                        if (!detectionTriggeredRef.current) { // <--- ADD THIS GUARD
                            console.log("Image found, but no anomaly result. Triggering detection...");

                            // Mark as triggered BEFORE the async call
                            detectionTriggeredRef.current = true; // <--- MARK AS TRUE

                            // Await the detection
                            await runAndFetchDetection(inspectionId);
                        }

                    } else {
                        console.error('Failed to fetch anomaly result:', err);
                        setAnomalyResult(null);
                    }
                }
            } else {
                setAnomalyResult(null);
            }
            // --- END ANOMALY CHECK LOGIC ---

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

    const handleImageUploadSuccess = () => {
        fetchData(); // Refetch all data
        // AUTOMATICALLY TRIGGER DETECTION AFTER UPLOAD
        // runAndFetchDetection(inspectionId);
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
            <Card className="rounded-4 shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4>Thermal Image Comparison</h4>
                        {/* Show detection status/spinner */}
                        {hasThermalImage && (
                            <small className={`fw-bold text-${isDetecting ? 'warning' : anomalyResult ? 'success' : 'muted'}`}>
                                {isDetecting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Running Anomaly Detection...
                                    </>
                                ) : anomalyResult ? (
                                    `Detection Complete`
                                ) : (
                                    'Detection Pending/Not Run'
                                )}
                            </small>
                        )}
                    </div>
                    <Row>
                        {/* --- Baseline Image Column (Unchanged) --- */}
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

                        {/* --- Current/Analyzed Image Column (MODIFIED) --- */}
                        <Col md={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    {anomalyResult ? 'Analyzed Image' : 'Current Maintenance Image'}
                                    {isAdmin && hasThermalImage && (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(thermalImage.id)}>Delete</Button>
                                    )}
                                </Card.Header>
                                <Card.Body>
                                    {hasThermalImage ? (
                                        <img
                                            // NEW LOGIC: Use the annotated image URL if the anomaly result is present
                                            src={anomalyResult
                                                ? `${API_BASE_URL}/api/inspections/${inspectionId}/anomalies/image?t=${timestamp}`
                                                : thermalImageUrl
                                            }
                                            alt={anomalyResult ? "Annotated Thermal" : "Current Thermal"}
                                            style={{ maxWidth: '100%' }}
                                        />
                                    ) : (
                                         <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={handleImageUploadSuccess} />
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            {/* END Thermal Image Comparison Section */}


            {/* --- Bounding Box Details Section (NEW) --- */}
            {anomalyResult && anomalyResult.detectionJsonOutput && (
                <Card className="mt-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <h4>Anomaly Details ({JSON.parse(anomalyResult.detectionJsonOutput || '[]').length} Detected)</h4>
                        <ul className="list-group list-group-flush">
                            {/* Parse the JSON string from detectionJsonOutput and map the list */}
                            {JSON.parse(anomalyResult.detectionJsonOutput || '[]').map((anomaly, index) => (
                                <li key={index} className="list-group-item">
                                    <strong>Error {index + 1}:</strong>
                                    <span className={`badge ms-2 ${anomaly.type === 'Faulty' ? 'bg-danger' : 'bg-warning'}`}>
                                        {anomaly.type}
                                    </span>
                                    <br/>
                                    <small className="text-muted">
                                        Coordinates: ({anomaly.location.x_min}, {anomaly.location.y_min}) to ({anomaly.location.x_max}, {anomaly.location.y_max})
                                        | Confidence: {anomaly.confidence}
                                        | Severity Score: {anomaly.severity_score}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    </Card.Body>
                </Card>
            )}
            {/* END Bounding Box Details Section */}
        </div>
    );
};

export default InspectionDetailPage;