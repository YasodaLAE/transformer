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

        inspectorName: '',
        inspectionEngineerDate: '',
        inspectionEngineerTime: '',
        transformerStatus: '',
        recommendedAction: '',
        correctiveAction: '',
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

                    inspectorName: data.inspectorName || '',
                    inspectionEngineerDate: data.inspectionEngineerDate || "",
                    inspectionEngineerTime: data.inspectionEngineerTime || "",
                    transformerStatus: data.transformerStatus || '',
                    recommendedAction: data.recommendedAction || '',
                    correctiveAction: data.correctiveAction || '',
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

                {/* 1. Transformer Info (System-generated / Read Only) */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-light fw-bold">Transformer Details (System Generated)</Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Transformer ID</Form.Label>
                                    <Form.Control value={formData.transformerId} readOnly disabled />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Region</Form.Label>
                                    <Form.Control value={formData.region} readOnly disabled />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Pole ID</Form.Label>
                                    <Form.Control value={formData.poleId} readOnly disabled />
                                </Form.Group>
                            </Col>

                            <Col md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Inspection Date</Form.Label>
                                    <Form.Control value={formData.inspectionDate} readOnly disabled />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>



                {/* 3. Job Details */}
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

                {/* 4. Inspection Image */}
                <Card className="mb-4 shadow-sm">
                    <Card.Header className="bg-primary text-white fw-bold">Inspection Reference Image</Card.Header>
                    <Card.Body className="text-center">
                        {imageUrl ? (
                            <Image src={imageUrl} alt="Thermal Inspection" fluid style={{ maxHeight: '500px', objectFit: 'contain' }} />
                        ) : (
                            <div className="p-5 text-muted">No thermal image available</div>
                        )}
                    </Card.Body>
                </Card>
{/* 5. Engineer Records */}
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

                        <h7 className="text-secondary">Status</h7>
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

                        <h7 className="text-secondary">Voltage / Current</h7>
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
                </div>
            </Form>
        </div>
    );
};

export default MaintenanceRecordPage;
