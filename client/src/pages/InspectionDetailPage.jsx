import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionById, deleteThermalImage, deleteBaselineImage, getTransformerById, getAnomalyDetectionResult, triggerAnomalyDetection, updateInspection } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { Card, Row, Col, Button, Spinner, Form } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import Toast from '../components/Toast';
import ZoomableImageModal from '../components/ZoomableImageModal';
import NotesCard from '../components/NotesCard';
import AnomalyAnnotationCanvas from '../components/AnomalyAnnotationCanvas';

// InspectionDetailPage.jsx (Defined OUTSIDE the functional component)

const getOriginalDimensions = (result) => {
    // Standard default dimensions (adjust these if your image size is consistently different)
    const DEFAULT_WIDTH = 238;
    const DEFAULT_HEIGHT = 183;

    if (result) {
        // 1. Check direct entity fields first (most reliable after Java fix)
        if (result.originalWidth != null && result.originalHeight != null) {
            return {
                original_width: result.originalWidth,
                original_height: result.originalHeight
            };
        }

        // 2. Fallback: Check JSON string (if needed)
        if (result.detectionJsonOutput) {
            try {
                const parsed = JSON.parse(result.detectionJsonOutput);
                // The dimensions are at the root level of the Python output JSON
                if (parsed.image_dimensions && parsed.image_dimensions.original_width != null) {
                    return parsed.image_dimensions;
                }
                // Fallback 2: Check inside the first anomaly element
                if (parsed.anomalies && parsed.anomalies.length > 0 && parsed.anomalies[0].image_dimensions) {
                     return parsed.anomalies[0].image_dimensions;
                }
            } catch (e) {
                console.warn("Failed to parse JSON for dimensions fallback:", e);
            }
        }
    }
    // Final fallback
    return { original_width: DEFAULT_WIDTH, original_height: DEFAULT_HEIGHT };
};




/**
 * Displays the detailed view for a single inspection, including image comparison,
 * anomaly analysis results, threshold control, and notes management.
 */
const InspectionDetailPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();

    // Primary Data States
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [baselineImageName, setBaselineImageName] = useState(null);

    // Anomaly Detection States
    const [tempThreshold, setTempThreshold] = useState(0.5); // Current confidence threshold (0.0 to 1.0)
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [timestamp, setTimestamp] = useState(Date.now()); // Used to force image cache bust

    // Component Refs & Hooks
    const detectionTriggeredRef = useRef(false); // Flag to prevent detection loop on initial mount
    const { user, isAdmin } = useAuth();
    const [toast, setToast] = useState(null);
    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    // Image/Baseline Name State
    const [baselineImageName, setBaselineImageName] = useState(null);

    // Zoom Modal State
    const detectionTriggeredRef = useRef(false);

    const [zoomModal, setZoomModal] = useState({ show: false, url: '', title: '' });

    const handleOpenZoomModal = (url, title) => {
        setZoomModal({ show: true, url: url, title: title });
    };

    const handleCloseZoomModal = () => {
        setZoomModal({ show: false, url: '', title: '' });
    };

    // Function to extract original dimensions from the result entity/JSON

    const originalDimensions = getOriginalDimensions(anomalyResult);
//     const originalDimensions = {
//         original_width: anomalyResult.originalWidth,
//         original_height: anomalyResult.originalHeight
//     };
    // ------------------------------------------------------------------

    // Fetches existing anomaly result if it exists in the database
    const fetchAnomalyResult = async (id) => {
        try {
            const resultResponse = await getAnomalyDetectionResult(id);
            setAnomalyResult(resultResponse.data);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setAnomalyResult(null);
            } else {
                console.error('Failed to fetch anomaly result:', err);
            }
        }
    };

    // Executes the Python detection script via API call
    const runAndFetchDetection = async (id, currentBaselineImageName, currentTempThreshold) => {
        setIsDetecting(true);
    // Function to run the detection and fetch the result (POST returns the entity)
    // ... (rest of imports and component definition) ...

        // Function to run the detection and fetch the result (POST returns the entity)
        const runAndFetchDetection = async (id, currentBaselineImageName, currentTempThreshold) => {
            setIsDetecting(true);

            if (!currentBaselineImageName) {
                        showErr('Cannot run detection: No baseline image is set for the transformer.');
                        setIsDetecting(false);
                        return;
            }

        try {
            // POST: Trigger the detection script with parameters
            const postResponse = await triggerAnomalyDetection(
                            id,
                            currentBaselineImageName,
                            currentTempThreshold
            );
            setAnomalyResult(postResponse.data);
            try {
                // 1. POST: Trigger the detection script with parameters
                const postResponse = await triggerAnomalyDetection(
                                id,
                                currentBaselineImageName,
                                currentTempThreshold
                );
                setAnomalyResult(postResponse.data);

            // CRITICAL FIX: Update timestamp to force browser cache bust for the new annotated image
            setTimestamp(new Date().getTime());
                // 2. CRITICAL FIX: Update the timestamp to force image cache bust
                setTimestamp(new Date().getTime());

            } catch (error) {
                console.error('Detection failed:', error.response ? error.response.data : error.message);
                showErr('Anomaly detection failed. Check server logs.');
            } finally {
                setIsDetecting(false);
            }
        };

    // Main function to fetch all required inspection and transformer data
    const fetchData = async () => {
        try {
            setLoading(true);
            const inspectionResponse = await getInspectionById(inspectionId);
            setInspection(inspectionResponse.data);
        const fetchData = async () => {
            try {
                setLoading(true);
                const inspectionResponse = await getInspectionById(inspectionId);
                setInspection(inspectionResponse.data);

                let currentBaselineName = '';
                let currentTransformer = null; // Store transformer locally for easy use
                if (inspectionResponse.data.transformerDbId) {
                    const transformerResponse = await getTransformerById(inspectionResponse.data.transformerDbId);
                    currentTransformer = transformerResponse.data;
                    setTransformer(currentTransformer);
                    currentBaselineName = currentTransformer.baselineImageName;
                    setBaselineImageName(currentBaselineName);
                }

                // Define prerequisites locally
                const hasThermalImage = inspectionResponse.data.thermalImage;
                const hasBaselineImage = !!currentBaselineName;


                // --- ANOMALY CHECK & AUTO-RE-RUN LOGIC (MODIFIED) ---
                if (hasThermalImage) {
                    try {
                        // A. Attempt to fetch existing result directly
                        const resultResponse = await getAnomalyDetectionResult(inspectionId);
                        const existingResult = resultResponse.data;
                        setAnomalyResult(existingResult);
                        detectionTriggeredRef.current = true;

                        // B. CRITICAL AUTO-RE-RUN CHECK for old data:
                        // If the result exists, but the necessary JSON is missing/empty, re-run.
                        // We check if the JSON output is null or just a very short string (e.g., "[]" or blank)
                        const jsonOutputMissing = !existingResult.detectionJsonOutput || existingResult.detectionJsonOutput.length < 10;

                        if (existingResult && jsonOutputMissing) {
                            console.log("Anomaly result found, but raw JSON data is missing (old record). Auto-triggering detection...");

                            // Check if we have the prerequisites to run detection
                            if (hasBaselineImage) {
                                // Use a default threshold (0.5 is a safe default for migration)
                                await runAndFetchDetection(inspectionId, currentBaselineName, 0.5);
                            } else {
                                console.warn("Cannot auto-re-run for old record: Baseline image is missing.");
                            }
                        }


                    } catch (err) {
                        // C. Result was NOT found (404 caught here)
                        if (err.response && err.response.status === 404) {
                            setAnomalyResult(null);

                            // Only trigger if this is the first time checking (prevents loop on mount)
                            if (!detectionTriggeredRef.current && hasBaselineImage) {
                                console.log("Image found, but no anomaly result. Triggering detection...");
                                detectionTriggeredRef.current = true;
                                // Set a default threshold for the initial run
                                await runAndFetchDetection(inspectionId, currentBaselineName, 0.5);
                            }

                        } else {
                            console.error('Failed to fetch anomaly result:', err);
                            setAnomalyResult(null);
                        }
                    }
                } else {
                    setAnomalyResult(null);
                    detectionTriggeredRef.current = false;
                }
                // --- END ANOMALY CHECK & AUTO-RE-RUN LOGIC ---

            } catch (err) {
                setError('Failed to fetch inspection details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
    // ... (rest of the component) ...
    useEffect(() => {
        fetchData();
    }, [inspectionId]);


    const handleViewBaselineImage = () => {
        if (transformer) {
            const imageUrl = `${API_BASE_URL}/api/transformers/${transformer.id}/baseline-image/view`;
            window.open(imageUrl, "_blank");
        }
    };

    const handleDelete = async (imageId) => {
      if (confirm("Delete this thermal image? This will also delete the anomaly detection result.")) {
        try {
          await deleteThermalImage(imageId);
          showOk('Thermal image and previous anomaly result deleted.');
          fetchData();
        } catch (err) {
          console.error("Failed to delete image:", err);
          showErr('Failed to delete thermal image');
        }
      }
    };

    const handleDeleteBaseline = async (transformerId) => {
      if (confirm("Delete the baseline image?")) {
        try {
          await deleteBaselineImage(transformerId);
          showOk('Baseline image deleted');
          fetchData();
        } catch (err) {
          console.error("Failed to delete baseline image:", err);
          showErr('Failed to delete baseline image');
        }
      }
    };

    // Triggers detection after a new image is successfully uploaded
    const handleImageUploadSuccess = async () => {
        showOk('Thermal image uploaded successfully. Running anomaly detection...');

        // Refetch ALL data to ensure thermal image object is present
        await fetchData();

        // Use the current threshold set by the slider for the run
        await runAndFetchDetection(inspectionId, baselineImageName, tempThreshold);

        // Final fetch to clean up state
        fetchData();
    };

    // Handler for the manual 'Re-Run Detection' button click
    const handleRunDetectionClick = async () => {
        const currentThreshold = parseFloat(tempThreshold);

        if (!hasThermalImage) {
            showErr("Please upload a maintenance image first.");
            return;
        }
        if (!hasBaselineImage) {
            showErr("Please upload a baseline image first.");
            return;
        }
        await runAndFetchDetection(inspectionId, baselineImageName, currentThreshold);
        fetchData();
    };

    // Handles saving notes to the server
    const handleSaveNotes = async (id, newNotes) => {
        if (!inspection) return;

        // Create an updated inspection object
        const updatedInspection = {
            ...inspection,
            notes: newNotes,
        };

        // Persist the changes via the general update endpoint
        await updateInspection(id, updatedInspection);

        // Update local state to reflect new notes immediately
        setInspection(updatedInspection);
    };


    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;

    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    const hasThermalImage = inspection.thermalImage;
    const thermalImage = inspection.thermalImage;
    const hasBaselineImage = transformer && transformer.baselineImageName;

    const baselineImageUrl = hasBaselineImage
        ? `${API_BASE_URL}/api/transformers/${transformer.id}/baseline-image/view?timestamp=${new Date().getTime()}`
        : '';
    const thermalImageUrl = hasThermalImage ? `${API_BASE_URL}/files/${thermalImage.fileName}` : '';

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

    // Logic to control visibility of the upload component
    const isUserLoggedIn = !!user;
    const showThermalUploader = isUserLoggedIn && !hasThermalImage;


    return (
        <div className="container-fluid">
            {transformer && (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        {/* Unified Header / Summary Details */}
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex flex-column">
                                <h3 className="fw-bold">{inspection.inspectionNo}</h3>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                                <div className={`badge rounded-pill text-white ${getStatusBadgeColor(inspection.status)} mb-2`}>
                                    {inspection.status}
                                </div>
                                {/* BASELINE IMAGE UPLOADER */}
                                {isUserLoggedIn && !hasBaselineImage && (
                                    <BaselineImageUploader
                                        transformerId={transformer.id}
                                        onUploadSuccess={fetchData}
                                    />
                                )}
                                {/* Baseline Image View/Delete logic */}
                                {hasBaselineImage && (
                                    <small className="text-muted mt-2 d-flex align-items-center">
                                        Baseline:
                                        <span className="text-primary ms-2 me-2">{baselineImageName}</span>
                                        <div className="d-flex align-items-center ms-2">
                                            {/* View button (visible to everyone) */}
                                            <Button
                                                variant="outline-info"
                                                size="sm"
                                                onClick={handleViewBaselineImage}
                                                className="me-2 d-flex align-items-center py-1 px-2"
                                                title="View Baseline Image"
                                            >
                                                <i className="bi bi-eye-fill"></i>
                                            </Button>
                                            {/* Delete button (only visible to isAdmin) */}
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

                        {/* LEFT SIDE: Status and Title */}
                        <h4>Thermal Image Comparison</h4>
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

                    {/* FIXED THRESHOLD CONTROL: Slider + Numeric Input for Precision */}
                        {hasThermalImage && hasBaselineImage && (
                            <div className="d-flex align-items-center bg-light p-2 rounded-3 border">

                                <label className="me-3 text-dark small fw-bold text-nowrap">
                                    Confidence Threshold:
                                </label>

                                {/* SLIDER INPUT (Visual Adjustment) */}
                                <Form.Range
                                    id="tempThresholdSlider"
                                    value={tempThreshold}
                                    onChange={(e) => setTempThreshold(parseFloat(e.target.value))}
                                    min="0.0"
                                    max="1.0"
                                    step="0.01" // Increased precision to 1% steps
                                    style={{ width: '150px' }}
                                    className="me-3"
                                    disabled={isDetecting}
                                />

                                {/* CUSTOM STEPPER CONTROL GROUP */}
                                <div className="input-group input-group-sm me-3" style={{ width: '100px', height: '31px' }}>

                                    /* MINUS BUTTON (-) */
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setTempThreshold(t => Math.max(0, t - 0.01))}
                                        disabled={isDetecting || tempThreshold <= 0.01}
                                        style={{ width: '25px' }}
                                    >
                                        <i className="bi bi-dash-lg"></i>
                                    </Button>

                                    {/* NUMERIC INPUT (Precision Entry - Added no-spinner class) */}
                                    <Form.Control
                                        type="number"
                                        value={Math.round(tempThreshold * 100)} // Display as percentage (0-100)
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value);
                                            // Ensure input is between 0 and 100 before converting back to 0.0-1.0 scale
                                            const safeValue = Math.min(100, Math.max(0, value)) / 100;
                                            setTempThreshold(safeValue);
                                        }}
                                        min="0"
                                        max="100"
                                        step="1"
                                        style={{ textAlign: 'center', width: '40px' }}
                                        className="form-control-sm border-secondary no-spinner" // CRITICAL FIX
                                        disabled={isDetecting}
                                    />

                                    {/* PLUS BUTTON (+) */}
                                    <Button
                                        variant="outline-secondary"
                                        onClick={() => setTempThreshold(t => Math.min(1.0, t + 0.01))}
                                        disabled={isDetecting || tempThreshold >= 1.00}
                                        style={{ width: '25px' }}
                                    >
                                        <i className="bi bi-plus-lg"></i>
                                    </Button>

                                </div>
                                <span className="me-3 small">%</span>

                                {/* RE-RUN BUTTON */}
                                <Button
                                    variant="success"
                                    onClick={handleRunDetectionClick}
                                    disabled={isDetecting || !hasThermalImage || !hasBaselineImage}
                                >
                                    {isDetecting ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-arrow-clockwise me-1"></i>}
                                    Re-Run
                                </Button>
                            </div>
                        )}
                    </div>
                    <Row>
                        {/* --- Baseline Image Column (VIEW) --- */}
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

                        {/* --- Current/Analyzed Image Column (UPLOAD/VIEW) --- */}
                        <Col md={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    {anomalyResult ? 'Analyzed Image' : 'Current Maintenance Image'}
                                    {/* Delete button only visible to isAdmin and if image exists */}
                                    {isAdmin && hasThermalImage && (
                                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(thermalImage.id)}>Delete</Button>
                                    )}
                                </Card.Header>

                                <Card.Body>
                                    {hasThermalImage && hasBaselineImage && anomalyResult ? (
                                        // RENDER THE INTERACTIVE CANVAS FOR EDITING (FR3.1)
                                        <AnomalyAnnotationCanvas
                                            inspectionId={inspectionId}
                                            // Use the ANNOTATED IMAGE as the background for the canvas
                                            imagePath={`${API_BASE_URL}/api/inspections/${inspectionId}/anomalies/image?t=${timestamp}`}
                                            // Pass the RAW JSON anomaly output for the canvas to load editable shapes
                                            initialAnnotationsJson={anomalyResult.detectionJsonOutput}
                                            annotatorUser={user.username}
                                            // Trigger a re-fetch to show the updated AI state (if needed)
                                            onAnnotationSaved={fetchData}
                                            originalImageDimensions={originalDimensions}
                                        />
                                    ) : isDetecting ? (
                                        // SHOW LOADING STATE
                                        <div
                                            className="d-flex flex-column align-items-center justify-content-center"
                                            style={{ minHeight: '300px', backgroundColor: '#f8f9fa', border: '1px dashed #ccc' }}
                                        >
                                            <Spinner animation="border" role="status" variant="primary" className="mb-3" />
                                            {/* ... (Spinner and text) ... */}
                                        </div>
                                    ) : showThermalUploader ? (
                                        // SHOW UPLOADER
                                        <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={handleImageUploadSuccess} />
                                    ) : (
                                        // 4. SHOW PLACEHOLDER
                                        <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}>
                                            <p className="text-muted">No thermal image available.</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            {/* END Thermal Image Comparison Section */}


            {/* --- Bounding Box Details Section --- */}
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

            {/* --- Inspector Notes Section (NEW) --- */}
            <NotesCard
                inspectionId={inspection.id}
                initialNotes={inspection.notes}
                onSave={handleSaveNotes}
                showOk={showOk}
                showErr={showErr}
                isAdmin={isAdmin}
            />

            {/* FINAL MODAL COMPONENT */}
            <ZoomableImageModal
                show={zoomModal.show}
                onClose={handleCloseZoomModal}
                imageUrl={zoomModal.url}
                title={zoomModal.title}
            />

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default InspectionDetailPage;