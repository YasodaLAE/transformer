import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaintenanceRecord, saveMaintenanceRecord, getAllAnnotationsForDisplay } from '../services/apiService';
import { Form, Button, Card, Row, Col, Spinner, Alert, Image, Table, Badge } from 'react-bootstrap';
import PageHeader from '../components/Header';
import Toast from '../components/Toast';
import { Link } from "react-router-dom";
import { exportMaintenanceRecordPdf } from '../services/apiService';

const MaintenanceRecordPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();
    const navigate = useNavigate();

    const [toast, setToast] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [thermalImageName, setThermalImageName] = useState(null);
    const [anomalies, setAnomalies] = useState([]);

    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    const [formData, setFormData] = useState({
        // Transformer & Inspection Context
        transformerId: '',
        inspectionNo: '',
        region: '',
        poleId: '',
        capacity: '',
        inspectionDate: '', // This holds the full ISO timestamp
        maintenanceDate: '',
        inspectionStatus: '',

        // Electrical Readings
        voltageL1: '', voltageL2: '', voltageL3: '',
        currentL1: '', currentL2: '', currentL3: '',

        // Oil Status
        oilLevel: '',
        oilTemperature: '',

        // Conclusion
        transformerStatus: '',
        recommendedAction: '',
        comments: ''
    });

// Helper to ensure Date AND Time are shown
    const formatDateTime = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        // Format: "24/08/2025, 14:30"
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Use 24-hour format to be clear
        });
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getMaintenanceRecord(inspectionId);
                const data = response.data;

                setThermalImageName(data.thermalImageFileName);

                setFormData({
                    transformerId: data.transformerId || '',
                    inspectionNo: data.inspectionNo || '',
                    region: data.region || '',
                    poleId: data.poleId || '',
                    capacity: data.capacity || '',

                    inspectionDate: data.inspectionDate || '',
                    maintenanceDate: data.maintenanceDate || 'N/A',
                    inspectionStatus: data.inspectionStatus || '',

                    voltageL1: data.voltageL1 || '',
                    voltageL2: data.voltageL2 || '',
                    voltageL3: data.voltageL3 || '',

                    currentL1: data.currentL1 || '',
                    currentL2: data.currentL2 || '',
                    currentL3: data.currentL3 || '',

                    oilLevel: data.oilLevel || '',
                    oilTemperature: data.oilTemperature || '',

                    transformerStatus: data.transformerStatus || '',
                    recommendedAction: data.recommendedAction || '',
                    comments: data.comments || ''
                });

                try {
                    const anomalyResponse = await getAllAnnotationsForDisplay(inspectionId);
                    const allAnomalies = anomalyResponse.data || [];
                    const activeAnomalies = allAnomalies.filter(a => a.currentStatus !== 'USER_DELETED');
                    setAnomalies(activeAnomalies);
                } catch (err) {
                    console.warn("Could not fetch anomalies:", err);
                }

            } catch (err) {
                console.error("Failed to load record:", err);
                setError("Could not load maintenance record.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [inspectionId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const cleanDateTime = (value) => {
        // If the value is 'N/A' or an empty string, send null to Java
        return (value === 'N/A' || value === '') ? null : value;
    };

    const handleExportPdf = async () => {
        try {
            const response = await exportMaintenanceRecordPdf(inspectionId);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Maintenance_Record_${inspectionId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Failed to export PDF", err);
            setError("Failed to export PDF.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);


        // Prepare the cleaned data object
        const dataToSend = {
            ...formData,

            // --- FIX: Clean up date/time fields before sending ---
            // These fields are coming from the read-only sections of the DTO/initial state
            // and might contain 'N/A' if the Inspection entity didn't have them set.
            inspectionDate: cleanDateTime(formData.inspectionDate),
            maintenanceDate: cleanDateTime(formData.maintenanceDate),

            // Ensure any new input fields are also cleaned if necessary,
            // especially if they map to LocalTime/LocalDate (though text inputs should default to empty string, not "N/A").
            inspectionEngineerDate: cleanDateTime(formData.inspectionEngineerDate),
            // ... any other potential date fields ...
        };

        try {
            await saveMaintenanceRecord(inspectionId, dataToSend);

            // SUCCESS NOTIFICATION
            showOk("Maintenance record saved successfully!");

            // OPTIONAL: Keep the navigation, but only after showing the toast.
            setTimeout(() => {
                navigate(`/inspections/by-inspection/${inspectionId}`);
            }, 1500);
        } catch (err) {
            console.error("Failed to save:", err);
            // ERROR NOTIFICATION
            showErr("Failed to save record. Please try again.");
            // We set the dedicated error state, but the toast also shows the general error.
            setError("Failed to save record. Please try again.");
        }
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    const imageUrl = thermalImageName
        ? `${API_BASE_URL}/api/inspections/${inspectionId}/annotations/image?t=${new Date().getTime()}`
        : null;

    return (
        <div className="container-fluid mb-5">
            <Link to={`/inspections/by-inspection/${inspectionId}`} className="btn btn-sm btn-outline-secondary mb-3">
                <i className="bi bi-arrow-left me-1"></i> Back to Inspection
            </Link>
            <div className="mb-4">
                <h4 className="fw-bold text-primary">
                    Maintenance Record Sheet
                </h4>

            </div>
            {error && <Alert variant="danger">{error}</Alert>}


            <Form onSubmit={handleSubmit}>

                {/* 1. General Information */}
{/* 1. General Information */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">General Information</Card.Header>
                    <Card.Body>
                        {/* Row 1: Transformer Static Data */}
                        <Row className="mb-3">
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Transformer ID</Form.Label>
                                    <Form.Control type="text" value={formData.transformerId} readOnly disabled className="fw-bold" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Region</Form.Label>
                                    <Form.Control type="text" value={formData.region} readOnly disabled />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Pole ID</Form.Label>
                                    <Form.Control type="text" value={formData.poleId} readOnly disabled />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Capacity (KVA)</Form.Label>
                                    <Form.Control type="text" value={formData.capacity} readOnly disabled />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Row 2: Inspection Specific Data (Starts with Inspection No) */}
                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Inspection No.</Form.Label>
                                    <Form.Control type="text" value={formData.inspectionNo} readOnly disabled className="fw-bold" />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Inspection Date & Time</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formatDateTime(formData.inspectionDate)}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Maintenance Date</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formatDateTime(formData.maintenanceDate)}
                                        readOnly
                                        disabled
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label className="text-muted small">Status</Form.Label>
                                    <div><Badge bg="info" className="p-2">{formData.inspectionStatus}</Badge></div>
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                {/* 2. Inspection Reference & Anomalies */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-primary text-white fw-bold">Inspection Findings</Card.Header>
                    <Card.Body>
                        <Row>
                            {/* Image Column */}
                            <Col md={5} className="text-center border-end">
                                {imageUrl ? (
                                    <div style={{ overflow: 'hidden', borderRadius: '4px', backgroundColor: '#f8f9fa', padding: '10px' }}>
                                        <Image
                                            src={imageUrl}
                                            alt="Annotated Thermal Inspection"
                                            fluid
                                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                                            onError={(e) => {
                                                if (thermalImageName) {
                                                    e.target.src = `${API_BASE_URL}/files/${thermalImageName}`;
                                                }
                                            }}
                                        />
                                        <div className="mt-2 text-muted small">Annotated Thermal Image</div>
                                    </div>
                                ) : (
                                    <div className="p-5 text-muted bg-light rounded">
                                        No thermal image available.
                                    </div>
                                )}
                            </Col>

                            {/* Anomalies Table Column */}
                            <Col md={7}>
                                <h6 className="fw-bold mb-3 text-secondary">Detected Anomalies</h6>
                                {anomalies.length > 0 ? (
                                    <Table striped bordered hover size="sm" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Type</th>
                                                <th>Conf / Severity</th>
                                                <th>Location (px)</th>
                                                <th>Source</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                                                            {anomalies.map((anomaly, index) => {
                                                                                // 1. Logic to display Confidence/Severity or "Manual"
                                                                                const confidenceDisplay = anomaly.aiConfidence
                                                                                    ? `Conf: ${(anomaly.aiConfidence * 100).toFixed(1)}%`
                                                                                    : (anomaly.confidence ? `Conf: ${(anomaly.confidence * 100).toFixed(1)}%` : <span className="text-muted fst-italic">Manual</span>);

                                                                                const severityDisplay = anomaly.aiSeverityScore
                                                                                    ? `Sev: ${anomaly.aiSeverityScore}`
                                                                                    : (anomaly.severity_score ? `Sev: ${anomaly.severity_score}` : "");

                                                                                // 2. FIX: Case-insensitive check for Faulty vs Potentially Faulty
                                                                                const isFaulty = anomaly.faultType?.toUpperCase() === 'FAULTY';
                                                                                const badgeColor = isFaulty ? 'danger' : 'warning';

                                                                                return (
                                                                                    <tr key={index}>
                                                                                        <td>{index + 1}</td>
                                                                                        <td>
                                                                                            <Badge bg={badgeColor}>
                                                                                                {anomaly.faultType}
                                                                                            </Badge>
                                                                                        </td>
                                                                                        <td>
                                                                                            {confidenceDisplay} <br/> {severityDisplay}
                                                                                        </td>
                                                                                        <td className="font-monospace text-muted small">
                                                                                            x:{Math.round(anomaly.x !== undefined ? anomaly.x : anomaly.location?.x_min)}
                                                                                            y:{Math.round(anomaly.y !== undefined ? anomaly.y : anomaly.location?.y_min)}<br/>
                                                                                            [{Math.round(anomaly.width !== undefined ? anomaly.width : (anomaly.location?.x_max - anomaly.location?.x_min))}x
                                                                                             {Math.round(anomaly.height !== undefined ? anomaly.height : (anomaly.location?.y_max - anomaly.location?.y_min))}]
                                                                                        </td>
                                                                                        <td>
                                                                                            {anomaly.originalSource === 'USER' ? (
                                                                                                <Badge bg="info">Added by {anomaly.userId || 'User'}</Badge>
                                                                                            ) : (
                                                                                                <Badge bg="secondary">AI Detected</Badge>
                                                                                            )}
                                                                                        </td>
                                                                                    </tr>
                                                                                );
                                                                            })}
                                                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="alert alert-light text-center">
                                        No anomalies detected or all have been resolved.
                                    </div>
                                )}
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-primary text-white fw-bold">Engineer Records</Card.Header>

                    <Card.Body>

                        {/* ================= ENGINEER INFORMATION ================= */}
                        <h6 className="text-primary mb-3">Engineer Information</h6>

                        <Row>
                            {/* Inspector Name */}
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Inspector Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="inspectorName"
                                        value={formData.inspectorName || ""}
                                        onChange={handleChange}
                                        placeholder="Enter inspector name"
                                    />
                                </Form.Group>
                            </Col>

                            {/* Inspection Date */}
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="inspectionEngineerDate"
                                        value={formData.inspectionEngineerDate || ""}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            {/* Inspection Time */}
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Time</Form.Label>
                                    <Form.Control
                                        type="time"
                                        name="inspectionEngineerTime"
                                        value={formData.inspectionEngineerTime || ""}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <h6 className="text-secondary">Status</h6>
                        <Row>
                            {/* Transformer Status */}
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transformer Status</Form.Label>
                                    <Form.Select
                                        name="transformerStatus"
                                        value={formData.transformerStatus}
                                        onChange={handleChange}
                                    >
                                        <option value="">-- Select Status --</option>
                                        <option value="OK">OK</option>
                                        <option value="Needs Maintenance">Needs Maintenance</option>
                                        <option value="Urgent Attention">Urgent Attention</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            {/* Recommended Action */}
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Recommended Action</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="recommendedAction"
                                        value={formData.recommendedAction}
                                        onChange={handleChange}
                                        placeholder="Enter recommended action"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />


                        {/* ================= ELECTRICAL READINGS ================= */}
                        <h6 className="text-primary mb-3">Readings</h6>

                        <h6 className="text-secondary">Voltage / Current</h6>
                        <Row className="mb-3">

                            <Col md={4}>
                                <Form.Label>L1</Form.Label>
                                <Form.Control className="mb-2" placeholder="Voltage" name="voltageL1" value={formData.voltageL1} onChange={handleChange} />
                                <Form.Control placeholder="Current" name="currentL1" value={formData.currentL1} onChange={handleChange} />
                            </Col>

                            <Col md={4}>
                                <Form.Label>L2</Form.Label>
                                <Form.Control className="mb-2" placeholder="Voltage" name="voltageL2" value={formData.voltageL2} onChange={handleChange} />
                                <Form.Control placeholder="Current" name="currentL2" value={formData.currentL2} onChange={handleChange} />
                            </Col>

                            <Col md={4}>
                                <Form.Label>L3</Form.Label>
                                <Form.Control className="mb-2" placeholder="Voltage" name="voltageL3" value={formData.voltageL3} onChange={handleChange} />
                                <Form.Control placeholder="Current" name="currentL3" value={formData.currentL3} onChange={handleChange} />
                            </Col>
                        </Row>

                        <h6 className="text-secondary mt-4">Oil Status</h6>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Oil Level</Form.Label>
                                    <Form.Select name="oilLevel" value={formData.oilLevel} onChange={handleChange}>
                                        <option value="">-- Select --</option>
                                        <option value="Normal">Normal</option>
                                        <option value="Low">Low</option>
                                        <option value="Critical">Critical</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>

                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Oil Temperature (°C)</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="oilTemperature"
                                        value={formData.oilTemperature}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />


                        {/* ================= CONCLUSION & REMARKS ================= */}
                        <h6 className="text-primary mb-3">Remarks</h6>

                        <Form.Group className="mb-3">
                            <Form.Label>Corrective Actions Performed</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="correctiveAction"
                                value={formData.correctiveAction}
                                onChange={handleChange}
                                placeholder="Describe corrective actions taken"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Additional Remarks</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="comments"
                                value={formData.comments}
                                onChange={handleChange}
                                placeholder="Enter additional notes or remarks"
                            />
                        </Form.Group>

                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button variant="primary" type="submit" size="lg">Save Record</Button>
                    <Button variant="outline-dark" onClick={handleExportPdf}>Export PDF</Button>
                </div>
            </Form>
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default MaintenanceRecordPage;