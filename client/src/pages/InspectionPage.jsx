import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer, createInspection, getTransformerById } from '../services/apiService';
import { Button, Card, Row, Col } from 'react-bootstrap';
import AddInspectionModal from '../components/AddInspectionModal';
import InspectionTable from '../components/InspectionTable';
import { useAuth } from '../hooks/AuthContext'; // Import the useAuth hook


const InspectionPage = () => {
    const { transformerId } = useParams();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const { isAdmin, login, logout } = useAuth();
    const [transformer, setTransformer] = useState(null);

    const fetchInspections = useCallback(async () => {
        try {
            const [inspectionsResponse, transformerResponse] = await Promise.all([
                            getInspectionsByTransformer(transformerId),
                            getTransformerById(transformerId)
                        ]);

                        setInspections(inspectionsResponse.data);
                        setTransformer(transformerResponse.data);
                        setLoading(false);
                       setError(null);
        } catch (err) {
            setError('Failed to fetch inspections.');
            setLoading(false);
            console.error(err);
        }
    }, [transformerId]);

    useEffect(() => {
        fetchInspections();
    }, [fetchInspections]);

    const handleInspectionAdded = () => {
        // After an inspection is added, re-fetch the list to update the table
        fetchInspections();
        setShowAddModal(false);
    };

    if (loading) {
        return <p>Loading inspections...</p>;
    }

    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <div className="container-fluid">
            {transformer && (
                <Card className="mb-4 rounded-4 shadow-sm">
                    <Card.Body>
                        <div className="d-flex align-items-start mb-2">
                            <h3 className="me-3 fw-bold">{transformer.transformerId}</h3>
                            <div className="d-flex align-items-center mt-1">
                                <span className="text-muted">{transformer.region}</span>
                                <span className="ms-2 text-primary">📍</span>
                                <span className="text-muted">{transformer.details}</span>
                            </div>
                        </div>
                        <Row className="text-center">
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.poleId}</h6>
                                <small className="text-muted">Pole No</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.capacity || 'N/A'}</h6>
                                <small className="text-muted">Capacity</small>
                            </Col>
                            <Col className="border-end py-2">
                                <h6 className="mb-0 fw-bold">{transformer.transformerType}</h6>
                                <small className="text-muted">Type</small>
                            </Col>
                            <Col className="py-2">
                                <h6 className="mb-0 fw-bold">{transformer.noOfFeeders || 'N/A'}</h6>
                                <small className="text-muted">No. of Feeders</small>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
                        )}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformer Inspections</h2>
                {isAdmin ? (
                    <>
                <Button onClick={() => setShowAddModal(true)}>Add Inspection</Button>
                </>
                ) : (<p> </p> )}

            </div>
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={inspections}
                    onInspectionDeleted={fetchInspections}
                />

            ) : (
                <p>No inspections found for this transformer.</p>
            )}
            <AddInspectionModal
                show={showAddModal}
                handleClose={() => setShowAddModal(false)}
                onInspectionAdded={handleInspectionAdded}
                transformerId={transformerId}
            />
        </div>
    );
};

export default InspectionPage;