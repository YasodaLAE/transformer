import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMaintenanceRecord, saveMaintenanceRecord } from '../services/apiService';
import { Form, Button, Card, Row, Col, Spinner, Alert, Image } from 'react-bootstrap';
import PageHeader from '../components/Header';

const MaintenanceRecordPage = () => {
    const API_BASE_URL = 'http://localhost:8080';
    const { inspectionId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const [thermalImageName, setThermalImageName] = useState(null);

    const [formData, setFormData] = useState({
        transformerId: '',
        region: '',
        poleId: '',
        inspectionDate: '',

        jobStartedTime: '',
        jobCompletedTime: '',

        voltageL1: '', voltageL2: '', voltageL3: '',
        currentL1: '', currentL2: '', currentL3: '',

        oilLevel: '',
        oilTemperature: '',

        transformerStatus: '',
        recommendedAction: '',
        comments: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getMaintenanceRecord(inspectionId);
                const data = response.data;

                setThermalImageName(data.thermalImageFileName);

                setFormData({
                    transformerId: data.transformerId || '',
                    region: data.region || '',
                    poleId: data.poleId || '',
                    inspectionDate: data.inspectionDate || '',

                    jobStartedTime: data.jobStartedTime || '',
                    jobCompletedTime: data.jobCompletedTime || '',

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        try {
            await saveMaintenanceRecord(inspectionId, formData);
            setSuccessMsg("Record saved successfully!");
        } catch (err) {
            console.error("Failed to save:", err);
            setError("Failed to save record. Please try again.");
        }
    };

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;

    const imageUrl = thermalImageName ? `${API_BASE_URL}/files/${thermalImageName}` : null;

    return (
        <div className="container-fluid mb-5">
            <PageHeader title="Maintenance Record Sheet" />

            {error && <Alert variant="danger">{error}</Alert>}
            {successMsg && <Alert variant="success">{successMsg}</Alert>}

            <Form onSubmit={handleSubmit}>

                {/* 1. Transformer Info (Read-Only) */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">Transformer Details</Card.Header>
                    <Card.Body>
                        <Row>
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
                                    <Form.Label className="text-muted small">Inspection Date</Form.Label>
                                    <Form.Control type="text" value={formData.inspectionDate} readOnly disabled />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 2. Job Details */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">Job Details</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Started Time</Form.Label>
                                    <Form.Control type="time" name="jobStartedTime" value={formData.jobStartedTime} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Job Completed Time</Form.Label>
                                    <Form.Control type="time" name="jobCompletedTime" value={formData.jobCompletedTime} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* --- NEW LOCATION: Inspection Image (Between Job Details and Readings) --- */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-primary text-white fw-bold">Inspection Reference Image</Card.Header>
                    <Card.Body className="text-center">
                        {imageUrl ? (
                            <div style={{ overflow: 'hidden', borderRadius: '4px', backgroundColor: '#f8f9fa', padding: '10px' }}>
                                <Image src={imageUrl} alt="Thermal Inspection" fluid style={{ maxHeight: '500px', objectFit: 'contain' }} />
                                <div className="mt-2 text-muted small">Thermal Image for Inspection #{inspectionId}</div>
                            </div>
                        ) : (
                            <div className="p-5 text-muted bg-light rounded">
                                No thermal image available for this inspection.
                            </div>
                        )}
                    </Card.Body>
                </Card>

                {/* 3. Readings */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">Readings</Card.Header>
                    <Card.Body>
                        <h6 className="mb-3 text-primary">Voltage & Current</h6>
                        <Row className="mb-3">
                            <Col md={4}>
                                <Form.Label>Phase 1 (L1)</Form.Label>
                                <Form.Control placeholder="Voltage (V)" name="voltageL1" value={formData.voltageL1} onChange={handleChange} className="mb-2" />
                                <Form.Control placeholder="Current (A)" name="currentL1" value={formData.currentL1} onChange={handleChange} />
                            </Col>
                            <Col md={4}>
                                <Form.Label>Phase 2 (L2)</Form.Label>
                                <Form.Control placeholder="Voltage (V)" name="voltageL2" value={formData.voltageL2} onChange={handleChange} className="mb-2" />
                                <Form.Control placeholder="Current (A)" name="currentL2" value={formData.currentL2} onChange={handleChange} />
                            </Col>
                            <Col md={4}>
                                <Form.Label>Phase 3 (L3)</Form.Label>
                                <Form.Control placeholder="Voltage (V)" name="voltageL3" value={formData.voltageL3} onChange={handleChange} className="mb-2" />
                                <Form.Control placeholder="Current (A)" name="currentL3" value={formData.currentL3} onChange={handleChange} />
                            </Col>
                        </Row>

                        <h6 className="mb-3 text-primary border-top pt-3">Oil Status</h6>
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
                                    <Form.Control type="text" name="oilTemperature" value={formData.oilTemperature} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* 4. Status & Remarks */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">Conclusion</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transformer Status</Form.Label>
                                    <Form.Select name="transformerStatus" value={formData.transformerStatus} onChange={handleChange}>
                                        <option value="">-- Select Status --</option>
                                        <option value="OK">OK</option>
                                        <option value="Needs Maintenance">Needs Maintenance</option>
                                        <option value="Urgent Attention">Urgent Attention</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Recommended Action</Form.Label>
                                    <Form.Control type="text" name="recommendedAction" value={formData.recommendedAction} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Engineer Remarks</Form.Label>
                            <Form.Control as="textarea" rows={3} name="comments" value={formData.comments} onChange={handleChange} />
                        </Form.Group>
                    </Card.Body>
                </Card>

                <div className="d-flex justify-content-end gap-2">
                    <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
                    <Button variant="primary" type="submit" size="lg">Save Record</Button>
                </div>
            </Form>
        </div>
    );
};

export default MaintenanceRecordPage;