import React, { useState, useEffect, useRef } from 'react';
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


const InspectionDetailPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showBaselineModal, setShowBaselineModal] = useState(false);
    const [baselineImageName, setBaselineImageName] = useState(null);

    const [tempThreshold, setTempThreshold] = useState(0.5);

    const { user, isAdmin } = useAuth();

    const [toast, setToast] = useState(null);
    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    const [anomalyResult, setAnomalyResult] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [timestamp, setTimestamp] = useState(Date.now());

    const detectionTriggeredRef = useRef(false);

    // NEW STATE & HANDLERS FOR ZOOM MODAL
    const [zoomModal, setZoomModal] = useState({ show: false, url: '', title: '' });
    // 1. Parse the detection JSON (need to handle possibility of empty array)
    const parsedAnomalyData = JSON.parse(anomalyResult?.detectionJsonOutput || '[]');

    // 2. Extract dimensions from the first anomaly object (or pass a default)
    // ASSUMING original image dimensions are stored in the *first* anomaly object's payload:
    const originalDimensions = parsedAnomalyData[0]?.image_dimensions || {
        original_width: 1000,
        original_height: 750 // Use safe defaults until data is loaded
    }

    const handleOpenZoomModal = (url, title) => {
        setZoomModal({ show: true, url: url, title: title });
    };

    const handleCloseZoomModal = () => {
        setZoomModal({ show: false, url: '', title: '' });
    };
    // END NEW STATE & HANDLERS

    // Function to fetch the existing anomaly result if it exists
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

    // Function to run the detection and fetch the result (POST then GET)
    const runAndFetchDetection = async (id, currentBaselineImageName, currentTempThreshold) => {
        setIsDetecting(true);

        if (!currentBaselineImageName) {
                    showErr('Cannot run detection: No baseline image is set for the transformer.');
                    setIsDetecting(false);
                    return;
        }

        try {
            // 1. POST: Trigger the detection script with parameters
            const postResponse = await triggerAnomalyDetection(
                            id,
                            currentBaselineImageName,
                            currentTempThreshold
            );
            setAnomalyResult(postResponse.data);

            // 2. CRITICAL FIX: Update the timestamp to force image cache bust
            setTimestamp(new Date().getTime());

        } catch (error) {
            console.error('Detection failed:', error.response ? error.response.data : error.message);
            showErr('Anomaly detection failed. Check server logs.');
        } finally {
            setIsDetecting(false);
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const inspectionResponse = await getInspectionById(inspectionId);
            setInspection(inspectionResponse.data);

            let currentBaselineName = '';
            if (inspectionResponse.data.transformerDbId) {
                const transformerResponse = await getTransformerById(inspectionResponse.data.transformerDbId);
                setTransformer(transformerResponse.data);
                currentBaselineName = transformerResponse.data.baselineImageName;
                setBaselineImageName(currentBaselineName);
            }

            // --- ANOMALY CHECK LOGIC ---
            if (inspectionResponse.data.thermalImage) {
                try {
                    // A. Attempt to fetch existing result directly
                    const resultResponse = await getAnomalyDetectionResult(inspectionId);
                    setAnomalyResult(resultResponse.data);
                    detectionTriggeredRef.current = true;

                } catch (err) {
                    // B. Result was NOT found (404 caught here)
                    if (err.response && err.response.status === 404) {
                        setAnomalyResult(null);

                        // Only trigger if this is the first time checking (prevents loop on mount)
                        if (!detectionTriggeredRef.current) {
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

    // FIX: Explicitly trigger detection after upload instead of just fetching data
    const handleImageUploadSuccess = async () => {
        showOk('Thermal image uploaded successfully. Running anomaly detection...');

        // Use the current threshold set by the slider for the run
        await runAndFetchDetection(inspectionId, baselineImageName, tempThreshold);

        // Refetch ALL data to refresh component state
        fetchData();
    };

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

    // --- LOGIC: Determine if the upload component should be visible ---
    const isUserLoggedIn = !!user;
    const showThermalUploader = isUserLoggedIn && !hasThermalImage;
    // -------------------------------------------------------------------

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
                            </div>
                            {/* Right side: Status and Baseline Image Section */}
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
                                    Temperature Difference:
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

                                    {/* MINUS BUTTON (-) */}
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
{/*                                 <Card.Body> */}
{/*                                     {isDetecting ? ( */}
{/*                                         // 1. **NICE LOADING STATE** */}
{/*                                         <div */}
{/*                                             className="d-flex flex-column align-items-center justify-content-center" */}
{/*                                             style={{ minHeight: '300px', backgroundColor: '#f8f9fa', border: '1px dashed #ccc' }} */}
{/*                                         > */}
{/*                                             <Spinner animation="border" role="status" variant="primary" className="mb-3"> */}
{/*                                                 <span className="visually-hidden">Running Anomaly Detection...</span> */}
{/*                                             </Spinner> */}
{/*                                             <p className="text-primary fw-bold mb-1">Running Anomaly Detection...</p> */}
{/*                                             <small className="text-muted">Analyzing image with YOLO model...</small> */}
{/*                                         </div> */}
{/*                                     ) : hasThermalImage ? ( */}
{/*                                         // 2. SHOW IMAGE: Make the image clickable and render */}
{/*                                         <div */}
{/*                                             onClick={() => handleOpenZoomModal( */}
{/*                                                 anomalyResult */}
{/*                                                 ? `${API_BASE_URL}/api/inspections/${inspectionId}/anomalies/image?t=${timestamp}` */}
{/*                                                 : thermalImageUrl, */}
{/*                                                 anomalyResult ? 'Analyzed Image' : 'Current Maintenance Image' */}
{/*                                             )} */}
{/*                                             style={{ cursor: 'zoom-in' }} // Add zoom cursor for visual cue */}
{/*                                         > */}
{/*                                             <img */}
{/*                                                 src={anomalyResult */}
{/*                                                     ? `${API_BASE_URL}/api/inspections/${inspectionId}/anomalies/image?t=${timestamp}` */}
{/*                                                     : thermalImageUrl */}
{/*                                                 } */}
{/*                                                 alt={anomalyResult ? "Annotated Thermal" : "Current Thermal"} */}
{/*                                                 style={{ maxWidth: '100%' }} */}
{/*                                             /> */}
{/*                                             <small className="text-muted mt-2 d-block">Click image to inspect (Zoom/Pan).</small> */}
{/*                                         </div> */}
{/*                                     ) : showThermalUploader ? ( */}
{/*                                         // 3. SHOW UPLOADER */}
{/*                                         <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={handleImageUploadSuccess} /> */}
{/*                                     ) : ( */}
{/*                                         // 4. SHOW PLACEHOLDER */}
{/*                                         <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}> */}
{/*                                             <p className="text-muted">No thermal image available.</p> */}
{/*                                         </div> */}
{/*                                     )} */}
{/*                                 </Card.Body> */}

{/*                                 // InspectionDetailPage.js (Around line 330, inside the Analyzed Image Card.Body) */}

{/*                                 // REMOVE ALL THE LOGIC inside Card.Body and replace with: */}

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
                                            {/* ... (Spinner and text) ... */}
                                        </div>
                                    ) : showThermalUploader ? (
                                        // SHOW UPLOADER
                                        <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={handleImageUploadSuccess} />
                                    ) : (
                                        // SHOW PLACEHOLDER
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