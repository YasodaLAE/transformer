// The complete, corrected code for: src/pages/InspectionDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionById } from '../services/apiService';
import ThermalImageUpload from '../components/ThermalImageUpload';
import { Card, Row, Col } from 'react-bootstrap';

const InspectionDetailPage = () => {
    const { inspectionId } = useParams();
    const [inspection, setInspection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInspectionDetails = async () => {
            try {
                const response = await getInspectionById(inspectionId);
                setInspection(response.data);
            } catch (err) {
                setError('Failed to fetch inspection details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInspectionDetails();
    }, [inspectionId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!inspection) return <p>Inspection not found.</p>;

    return (
        <div className="container-fluid">
            {/* Section 1: Displaying the Main Transformer Details */}
            {/* Note: We now access properties directly from the 'inspection' object */}
{/*             <Card className="mb-4 rounded-4 shadow-sm"> */}
{/*                 <Card.Body> */}
{/*                     <div className="d-flex justify-content-between align-items-start mb-2"> */}
{/*                         <div className="d-flex flex-column"> */}
{/*                             <h3 className="fw-bold">{inspection.transformerBusinessId}</h3> */}
{/*                             <div className="d-flex align-items-center mt-1"> */}
{/*                                 <span className="text-muted me-2">{inspection.region}</span> */}
{/*                                 <span className="text-primary me-1">📍</span> */}
{/*                                 <span className="text-muted">{inspection.details}</span> */}
{/*                             </div> */}
{/*                         </div> */}
{/*                     </div> */}
{/*                     <Row className="text-center"> */}
{/*                         <Col className="border-end py-2"> */}
{/*                             <h6 className="mb-0 fw-bold">{inspection.poleId}</h6> */}
{/*                             <small className="text-muted">Pole No</small> */}
{/*                         </Col> */}
{/*                         <Col className="border-end py-2"> */}
{/*                             <h6 className="mb-0 fw-bold">{inspection.capacity || 'N/A'}</h6> */}
{/*                             <small className="text-muted">Capacity</small> */}
{/*                         </Col> */}
{/*                         <Col className="border-end py-2"> */}
{/*                             <h6 className="mb-0 fw-bold">{inspection.transformerType}</h6> */}
{/*                             <small className="text-muted">Type</small> */}
{/*                         </Col> */}
{/*                         <Col className="py-2"> */}
{/*                             <h6 className="mb-0 fw-bold">{inspection.noOfFeeders || 'N/A'}</h6> */}
{/*                             <small className="text-muted">No. of Feeders</small> */}
{/*                         </Col> */}
{/*                     </Row> */}
{/*                 </Card.Body> */}
{/*             </Card> */}

            {/* Section 2: Displaying the Selected Inspection's Details */}
            <Card className="mb-4 rounded-4 shadow-sm">
                 <Card.Body>
                    <Card.Title>Details for Inspection No: {inspection.inspectionNo}</Card.Title>
                    <Card.Text>
                        <strong>Status:</strong> {inspection.status} <br />
                        <strong>Inspected Date:</strong> {inspection.inspectedDate} <br />
                        <strong>Next Maintenance:</strong> {inspection.maintenanceDate || 'N/A'}
                    </Card.Text>
                </Card.Body>
            </Card>

            {/* Section 3: The Thermal Image Upload Form */}
            <Card className="mb-4 rounded-4 shadow-sm">
                <Card.Body>
                    {/* Pass the business ID (e.g., "AX-8993") to the upload component */}
                    <ThermalImageUpload transformerId={inspection.transformerBusinessId} />
                </Card.Body>
            </Card>
        </div>
    );
};

export default InspectionDetailPage;