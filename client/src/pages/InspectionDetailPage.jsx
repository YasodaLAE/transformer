import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInspectionById, deleteThermalImage, deleteBaselineImage, getTransformerById, getAnomalyDetectionResult, triggerAnomalyDetection, updateInspection, getAllAnnotationsForDisplay, exportFeedbackLog } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import BaselineImageUploader from '../components/BaselineImageUploader';
import { Card, Row, Col, Button, Spinner, Form } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import Toast from '../components/Toast';
import ZoomableImageModal from '../components/ZoomableImageModal';
import NotesCard from '../components/NotesCard';
import ImageAnnotator from '../components/ImageAnnotator';
import InteractiveImage from '../components/InteractiveImage';

const InspectionDetailPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();

    const [inspection, setInspection] = useState(null);
    const [transformer, setTransformer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tempThreshold, setTempThreshold] = useState(0.5);
    const [anomalyResult, setAnomalyResult] = useState(null);
    const [isDetecting, setIsDetecting] = useState(false);
    const [timestamp, setTimestamp] = useState(Date.now());
    const detectionTriggeredRef = useRef(false);
    const { user, isAdmin } = useAuth();
    const [toast, setToast] = useState(null);
    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });
    const [baselineImageName, setBaselineImageName] = useState(null);
    const [zoomModal, setZoomModal] = useState({ show: false, url: '', title: '' });
    const [isAnnotating, setIsAnnotating] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [hasUserAnnotations, setHasUserAnnotations] = useState(false);
    const [activeAnomalyDetails, setActiveAnomalyDetails] = useState([]);
    const [selectedAnomalyId, setSelectedAnomalyId] = useState(null); // Added state for interactive selection

    const handleOpenZoomModal = (url, title) => setZoomModal({ show: true, url, title });
    const handleCloseZoomModal = () => setZoomModal({ show: false, url: '', title: '' });

    const runAndFetchDetection = async (id, currentBaselineImageName, currentTempThreshold) => {
        setIsDetecting(true);
        if (!currentBaselineImageName) {
            showErr('Cannot run detection: No baseline image is set for the transformer.');
            setIsDetecting(false);
            return;
        }
        try {
            const postResponse = await triggerAnomalyDetection(id, currentBaselineImageName, currentTempThreshold);
            setAnomalyResult(postResponse.data);
            setTimestamp(new Date().getTime());
            setRefreshKey(prev => prev + 1);
            await fetchData();
        } catch (error) {
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
            if (inspectionResponse.data.thermalImage) {
                let hasHistory = false;
                let savedAnnotationsForDisplay = [];

                try {
                    const allAnnotationsResponse = await getAllAnnotationsForDisplay(inspectionId);
                    savedAnnotationsForDisplay = allAnnotationsResponse.data;
                    // Check if ANY history exists (even deleted ones)
                    hasHistory = savedAnnotationsForDisplay && savedAnnotationsForDisplay.length > 0;
                } catch (annotationErr) {
                    console.warn("Could not check for saved annotations:", annotationErr);
                }

                try {
                    const resultResponse = await getAnomalyDetectionResult(inspectionId);
                    setAnomalyResult(resultResponse.data);
                    detectionTriggeredRef.current = true;

                    if (hasHistory) {
                        // --- FIX: Show User View if history exists ---
                        setHasUserAnnotations(true);
                        // Only show non-deleted annotations in the list and image
                        const visibleAnnotations = savedAnnotationsForDisplay.filter(a => a.currentStatus !== 'USER_DELETED');
                        setActiveAnomalyDetails(visibleAnnotations);
                    } else {
                        // --- Fallback to AI View ---
                        setHasUserAnnotations(false);
                        const aiDetails = JSON.parse(resultResponse.data.detectionJsonOutput || '[]').map(ann => ({
                            currentStatus: ann.type || 'FAULTY',
                            originalSource: 'AI',
                            x: ann.location.x_min,
                            y: ann.location.y_min,
                            width: ann.location.x_max - ann.location.x_min,
                            height: ann.location.y_max - ann.location.y_min,
                            aiConfidence: ann.confidence,
                            aiSeverityScore: ann.severity_score,
                            faultType: ann.faultType,
                            id: ann.id
                        }));
                        setActiveAnomalyDetails(aiDetails);
                    }
                } catch (err) {
                    if (err.response && err.response.status === 404) {
                        setAnomalyResult(null);
                        if (!detectionTriggeredRef.current) {
                            detectionTriggeredRef.current = true;
                            await runAndFetchDetection(inspectionId, currentBaselineName, 0.5);
                        }
                    } else {
                        setAnomalyResult(null);
                        setActiveAnomalyDetails([]);
                    }
                }
            } else {
                setAnomalyResult(null);
                detectionTriggeredRef.current = false;
                setActiveAnomalyDetails([]);
            }
        } catch (err) {
            setError('Failed to fetch inspection details.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [inspectionId]);

    const handleSelectAnomaly = (id) => {
        setSelectedAnomalyId(prevId => (prevId === id ? null : id));
    };

    const handleViewBaselineImage = () => {
        if (transformer) {
            const imageUrl = `${API_BASE_URL}/api/transformers/${transformer.id}/baseline-image/view`;
            window.open(imageUrl, "_blank");
        }
    };

    const handleDelete = async (imageId) => {
        if (window.confirm("Delete this thermal image? This will also delete the anomaly detection result.")) {
            try {
                await deleteThermalImage(imageId);
                showOk('Thermal image and previous anomaly result deleted.');
                fetchData();
            } catch (err) {
                showErr('Failed to delete thermal image');
            }
        }
    };

    const handleDeleteBaseline = async (transformerId) => {
        if (window.confirm("Delete the baseline image?")) {
            try {
                await deleteBaselineImage(transformerId);
                showOk('Baseline image deleted');
                fetchData();
            } catch (err) {
                showErr('Failed to delete baseline image');
            }
        }
    };

    const handleImageUploadSuccess = async () => {
        showOk('Thermal image uploaded successfully. Running anomaly detection...');
        await runAndFetchDetection(inspectionId, baselineImageName, tempThreshold);
        fetchData();
    };

    const handleRunDetectionClick = async () => {
        await runAndFetchDetection(inspectionId, baselineImageName, tempThreshold);
    };

    const handleSaveNotes = async (id, newNotes) => {
        if (!inspection) return;
        const updatedInspection = { ...inspection, notes: newNotes };
        await updateInspection(id, updatedInspection);
        setInspection(updatedInspection);
    };

    const formatTimestamp = (ts) => {
        if (!ts) return '';
        try {
            const date = new Date(ts);
            return new Intl.DateTimeFormat('en-GB', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', hour12: false
            }).format(date);
        } catch (e) {
            return ts;
        }
    };

    const handleExportFeedback = async () => {
        try {
            const response = await exportFeedbackLog(inspectionId);
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `feedback_log_inspection_${inspectionId}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showOk('Feedback log successfully exported as JSON.');
        } catch (err) {
            showErr('Failed to export feedback log. Check server logs.');
            console.error("Export error:", err);
        }
    };

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    const hasThermalImage = !!inspection.thermalImage;
    const thermalImage = inspection.thermalImage;
    const hasBaselineImage = !!(transformer && transformer.baselineImageName);
    const thermalImageUrl = hasThermalImage ? `${API_BASE_URL}/files/${thermalImage.fileName}` : '';
    const baselineImageUrl = hasBaselineImage ? `${API_BASE_URL}/api/transformers/${transformer.id}/baseline-image/view?timestamp=${new Date().getTime()}` : '';

    // Use raw thermal image as base (InteractiveImage draws boxes on top)
    const annotatedImageUrl = thermalImageUrl;

    const userAnnotatedImageUrl = `${API_BASE_URL}/api/inspections/${inspectionId}/annotations/image?key=${refreshKey}`;
    const displayImageUrl = hasUserAnnotations ? userAnnotatedImageUrl : annotatedImageUrl;
    // Force image refresh with key
    const finalDisplayImageUrl = `${displayImageUrl}&k=${refreshKey}`;

    const getStatusBadgeColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-primary';
            case 'in progress': return 'bg-success';
            case 'pending': return 'bg-danger';
            default: return 'bg-secondary';
        }
    };

    const isUserLoggedIn = !!user;
    const showThermalUploader = isUserLoggedIn && !hasThermalImage;

    return (
        <div className="container-fluid">
            {transformer && (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex flex-column">
                                <h3 className="fw-bold">{inspection.inspectionNo}</h3>
                            </div>
                            <div className="d-flex flex-column align-items-end">
                                <div className={`badge rounded-pill text-white ${getStatusBadgeColor(inspection.status)} mb-2`}>{inspection.status}</div>
                                <Link to={`/inspections/${inspectionId}/record`} className="btn btn-primary btn-sm mb-2">
                                    <i className="bi bi-file-text me-2"></i>Maintenance Record
                                </Link>
                                {isUserLoggedIn && !hasBaselineImage && (<BaselineImageUploader transformerId={transformer.id} onUploadSuccess={fetchData} />)}
                                {hasBaselineImage && (
                                    <small className="text-muted mt-2 d-flex align-items-center">
                                        Baseline: <span className="text-primary ms-2 me-2">{baselineImageName}</span>
                                        <div className="d-flex align-items-center ms-2">
                                            <Button variant="outline-info" size="sm" onClick={handleViewBaselineImage} className="me-2 d-flex align-items-center py-1 px-2" title="View Baseline Image"><i className="bi bi-eye-fill"></i></Button>
                                            {isAdmin && (<Button variant="outline-danger" size="sm" onClick={() => handleDeleteBaseline(transformer.id)} className="d-flex align-items-center py-1 px-2" title="Delete Baseline Image"><i className="bi bi-trash-fill"></i></Button>)}
                                        </div>
                                    </small>
                                )}
                            </div>
                        </div>
                        <Row className="text-center">
                            <Col className="border-end py-2"><h6 className="mb-0 fw-bold">{transformer.transformerId}</h6><small className="text-muted">Transformer No</small></Col>
                            <Col className="border-end py-2"><h6 className="mb-0 fw-bold">{transformer.poleId}</h6><small className="text-muted">Pole No</small></Col>
                            <Col className="border-end py-2"><h6 className="mb-0 fw-bold">{transformer.region}</h6><small className="text-muted">Branch</small></Col>
                            <Col className="py-2"><h6 className="mb-0 fw-bold">{inspection.inspectedBy}</h6><small className="text-muted">Inspected By</small></Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Card className="rounded-4 shadow-sm mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4>Thermal Image Comparison</h4>
                        {hasThermalImage && (
                            <small className={`fw-bold text-${isDetecting ? 'warning' : anomalyResult ? 'success' : 'muted'}`}>
                                {isDetecting ? (<><Spinner animation="border" size="sm" className="me-2" />Running Anomaly Detection...</>) : anomalyResult ? (`Detection Complete`) : ('Detection Pending/Not Run')}
                            </small>
                        )}
                        {hasThermalImage && isAdmin && hasBaselineImage && (
                            <div className="d-flex align-items-center bg-light p-2 rounded-3 border">
                                <label className="me-3 text-dark small fw-bold text-nowrap">Confidence Threshold:</label>
                                <Form.Range id="tempThresholdSlider" value={tempThreshold} onChange={(e) => setTempThreshold(parseFloat(e.target.value))} min="0.0" max="1.0" step="0.01" style={{ width: '150px' }} className="me-3" disabled={isDetecting} />
                                <div className="input-group input-group-sm me-3" style={{ width: '100px', height: '31px' }}>
                                    <Button variant="outline-secondary" onClick={() => setTempThreshold(t => Math.max(0, t - 0.01))} disabled={isDetecting || tempThreshold <= 0.01} style={{ width: '25px' }}><i className="bi bi-dash-lg"></i></Button>
                                    <Form.Control type="number" value={Math.round(tempThreshold * 100)} onChange={(e) => { const v = parseInt(e.target.value); setTempThreshold(Math.min(100, Math.max(0, v)) / 100); }} min="0" max="100" step="1" style={{ textAlign: 'center', width: '40px' }} className="form-control-sm border-secondary no-spinner" disabled={isDetecting} />
                                    <Button variant="outline-secondary" onClick={() => setTempThreshold(t => Math.min(1.0, t + 0.01))} disabled={isDetecting || tempThreshold >= 1.00} style={{ width: '25px' }}><i className="bi bi-plus-lg"></i></Button>
                                </div>
                                <span className="me-3 small">%</span>
                                {isAdmin &&
                                    <Button variant="success" onClick={handleRunDetectionClick} disabled={isDetecting || !hasThermalImage || !hasBaselineImage}>
                                        {isDetecting ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-arrow-clockwise me-1"></i>} Re-Run
                                    </Button>}
                            </div>
                        )}
                    </div>
                    <Row>
                        <Col md={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">Baseline</Card.Header>
                                <Card.Body className="text-center">
                                    {hasBaselineImage ? (<img src={baselineImageUrl} alt="Baseline" style={{ maxWidth: '100%' }} />) : (<div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}><p className="text-muted">No baseline image available.</p></div>)}
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                            <Card>
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    {isAnnotating ? 'Annotation Editor' : 'Analyzed Image'}
                                    {isAdmin && hasThermalImage && !isAnnotating && (<Button variant="outline-danger" size="sm" onClick={() => handleDelete(thermalImage.id)}>Delete</Button>)}
                                </Card.Header>
                                <Card.Body>
                                    {isDetecting ? (
                                        <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '300px' }}><Spinner animation="border" variant="primary" className="mb-3" /><p className="text-primary fw-bold mb-1">Running Anomaly Detection...</p></div>
                                    ) : hasThermalImage ? (
                                        isAnnotating ? (
                                            <ImageAnnotator
                                                key={refreshKey}
                                                inspectionId={inspectionId}
                                                imageUrl={thermalImageUrl}
                                                initialAnnotations={anomalyResult?.detectionJsonOutput || '[]'}
                                                onAnnotationsSaved={() => {
                                                    setIsAnnotating(false);
                                                    setRefreshKey(prev => prev + 1);
                                                    fetchData();
                                                }}
                                                onCancel={() => setIsAnnotating(false)}
                                            />
                                        ) : (
                                            <>
                                                <div onClick={() => handleOpenZoomModal(displayImageUrl, 'Analyzed Image')} style={{ cursor: 'zoom-in' }}>
                                                    <InteractiveImage
                                                        imageUrl={thermalImageUrl}
                                                        anomalies={JSON.stringify(activeAnomalyDetails.map(a => {
                                                            const x = a.x !== undefined ? a.x : (a.location?.x_min || 0);
                                                            const y = a.y !== undefined ? a.y : (a.location?.y_min || 0);
                                                            const w = a.width !== undefined ? a.width : ((a.location?.x_max || 0) - x);
                                                            const h = a.height !== undefined ? a.height : ((a.location?.y_max || 0) - y);
                                                            return { id: a.id, x, y, width: w, height: h };
                                                        }))}
                                                        onSelect={(id) => {
                                                             const element = document.getElementById(`anomaly-list-item-${id}`);
                                                             if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                             handleSelectAnomaly(id);
                                                         }}
                                                        selectedId={selectedAnomalyId}
                                                        onDelete={() => {}}
                                                        isAdmin={false}
                                                    />
                                                    <small className="text-muted mt-2 d-block">Click image to inspect (Zoom/Pan).</small>
                                                </div>
                                                {isAdmin && anomalyResult && (<Button variant="primary" onClick={() => setIsAnnotating(true)} className="mt-2"><i className="bi bi-pencil-square me-2"></i>Correct Annotations</Button>)}
                                            </>
                                        )
                                    ) : showThermalUploader ? (
                                        <ThermalImageUpload inspectionId={inspection.id} onUploadSuccess={handleImageUploadSuccess} />
                                    ) : (
                                        <div style={{ minHeight: '200px', display: 'grid', placeContent: 'center' }}><p className="text-muted">No thermal image available.</p></div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {activeAnomalyDetails && activeAnomalyDetails.length > 0 && !isAnnotating && (
                <Card className="mt-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h4>Anomaly Details ({activeAnomalyDetails.length} Detected)</h4>
                            {isAdmin &&
                                <Button variant="outline-dark" size="sm" onClick={handleExportFeedback}>
                                    <i className="bi bi-download me-1"></i> Export Feedback Log (JSON)
                                </Button>}
                        </div>

                        {/* Interactive Image moved to top card, removed here */}

                        <ul className="list-group list-group-flush">
                            {activeAnomalyDetails.map((anomaly, index) => {
                                const isRawAIData = anomaly.location && anomaly.location.x_min !== undefined;
                                const xMin = isRawAIData ? anomaly.location.x_min : anomaly.x;
                                const yMin = isRawAIData ? anomaly.location.y_min : anomaly.y;
                                const xMax = isRawAIData ? anomaly.location.x_max : (anomaly.x + anomaly.width);
                                const yMax = isRawAIData ? anomaly.location.y_max : (anomaly.y + anomaly.height);
                                const anomalyId = anomaly.id || index;

                                const sourceTag = anomaly.originalSource === 'USER'
                                    ? <span className="badge bg-info ms-2">User Added</span>
                                    : <span className="badge bg-secondary ms-2">AI Detected</span>;

                                let statusTagColor;
                                let statusTagText;
                                switch (anomaly.currentStatus) {
                                    case 'USER_ADDED': statusTagColor = 'bg-success'; statusTagText = 'Added by ' + (anomaly.userId || 'Unknown'); break;
                                    case 'USER_EDITED': statusTagColor = 'bg-warning text-dark'; statusTagText = 'Edited by ' + (anomaly.userId || 'Unknown'); break;
                                    case 'USER_VALIDATED': statusTagColor = 'bg-primary'; statusTagText = 'Validated by ' + (anomaly.userId || 'Unknown'); break;
                                    case 'USER_DELETED': statusTagColor = 'bg-dark'; statusTagText = 'Deleted by ' + (anomaly.userId || 'Unknown'); break;
                                    default: statusTagColor = 'bg-danger'; statusTagText = anomaly.currentStatus || 'Faulty';
                                }
                                const statusTag = <span className={`badge ms-2 ${statusTagColor}`}>{statusTagText}</span>;
                                const formattedTimestamp = formatTimestamp(anomaly.timestamp);

                                const confidenceDisplay = anomaly.aiConfidence
                                    ? `${(anomaly.aiConfidence * 100).toFixed(1)}%`
                                    : (anomaly.confidence ? `${(anomaly.confidence * 100).toFixed(1)}%` : <span className="text-muted fst-italic">Manually Added</span>);

                                const severityDisplay = anomaly.aiSeverityScore
                                    ? anomaly.aiSeverityScore
                                    : (anomaly.severity_score ? anomaly.severity_score : <span className="text-muted fst-italic">Manually Added</span>);

                                return (
                                    <li key={anomalyId} id={`anomaly-list-item-${anomalyId}`} className={`list-group-item ${anomalyId === selectedAnomalyId ? 'bg-info-subtle' : ''}`} onClick={() => handleSelectAnomaly(anomalyId)} style={{ transition: 'background-color 0.3s', cursor: 'pointer' }}>
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>Anomaly {index + 1}:</strong>
                                                {sourceTag}
                                                {statusTag}
                                            </div>
                                            {formattedTimestamp && (<small className="text-muted ms-3 fw-bold">Last Updated: {formattedTimestamp}</small>)}
                                        </div>
                                        <small className="text-muted">
                                            Coordinates: ({Math.round(xMin)}, {Math.round(yMin)}) to ({Math.round(xMax)}, {Math.round(yMax)})
                                            &nbsp;| Confidence: {confidenceDisplay}
                                            &nbsp;| Severity Score: {severityDisplay}
                                            {anomaly.comments && ` | Notes: ${anomaly.comments}`}
                                        </small>
                                    </li>
                                );
                            })}
                        </ul>
                    </Card.Body>
                </Card>
            )}

            <NotesCard inspectionId={inspection.id} initialNotes={inspection.notes} onSave={handleSaveNotes} showOk={showOk} showErr={showErr} isAdmin={isAdmin} />
            <ZoomableImageModal show={zoomModal.show} onClose={handleCloseZoomModal} imageUrl={zoomModal.url} title={zoomModal.title} />
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default InspectionDetailPage;