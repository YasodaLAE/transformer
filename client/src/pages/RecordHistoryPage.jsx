// src/pages/RecordHistoryPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMaintenanceHistoryByTransformer } from '../services/apiService';
import { Table, Card, Spinner, Alert } from 'react-bootstrap';
import PageHeader from '../components/Header';

const RecordHistoryPage = () => {
    const { transformerId } = useParams();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [transformerName, setTransformerName] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch the list of historical records
                const response = await getMaintenanceHistoryByTransformer(transformerId);
                setHistory(response.data);

                // Assuming the first record contains the transformer name for display
                if (response.data.length > 0) {
                    setTransformerName(response.data[0].transformerId);
                } else {
                    setTransformerName(transformerId);
                }
            } catch (err) {
                setError("Failed to load maintenance history.");
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [transformerId]);

    if (loading) return <div className="p-5 text-center"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <div className="container-fluid mb-5">
            <div className="mb-4">
                <h4 className="fw-bold text-primary">
                    Maintenance History for Transformer: {transformerName}
                </h4>
                <p className="text-muted">
                    Transformer ID: {transformerId}
                </p>
            </div>
            <Card className="shadow-sm">
                <Card.Body>
                    <Link to={`/inspections/by-transformer/${transformerId}`} className="btn btn-sm btn-outline-secondary mb-3">
                        <i className="bi bi-arrow-left me-1"></i> Back to Inspections
                    </Link>

                    {history.length === 0 ? (
                        <Alert variant="info" className="text-center">No previous maintenance records found for this transformer.</Alert>
                    ) : (
                        <Table striped bordered hover responsive>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Inspection No.</th>
                                    <th>Inspection Date</th>
                                    <th>Status</th>
                                    <th>Engineer</th>
                                    <th>View Record</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map((record, index) => (
                                    // FIX: Use 'record.id' (Primary Key of MaintenanceRecord) or 'record.inspectionId'
                                    <tr key={record.id}>
                                        <td>{index + 1}</td>
                                        <td>{record.inspectionNo}</td>
                                        <td>{record.inspectionEngineerDate}</td>
                                        <td>{record.transformerStatus}</td>
                                        <td>{record.inspectorName}</td>
                                        <td>
                                            {/* Link back to the detailed maintenance sheet */}
                                            <Link to={`/inspections/${record.inspectionId}/record`}>View Report</Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default RecordHistoryPage;