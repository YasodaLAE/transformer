import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer } from '../services/apiService';
import { Button } from 'react-bootstrap';
// import AddInspectionModal from '../components/AddInspectionModal'; // You'll create this later

const InspectionPage = () => {
    const { transformerId } = useParams();
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        const fetchInspections = async () => {
            try {
                const response = await getInspectionsByTransformer(transformerId);
                setInspections(response.data);
            } catch (err) {
                setError('Failed to fetch inspections.');
            } finally {
                setLoading(false);
            }
        };
        fetchInspections();
    }, [transformerId]);

    if (loading) return <p>Loading inspections...</p>;
    if (error) return <p className="text-danger">{error}</p>;

    return (
        <div>
            <h2>Inspections for Transformer ID: {transformerId}</h2>
            <Button onClick={() => setShowAddModal(true)}>Add Inspection</Button>
            {/* Display the table of inspections here */}
            {/* You will need to create a table component similar to TransformerTable */}
            {/* The photo shows a table with columns: Inspection No., Inspected Date, Maintenance Date, Status */}
        </div>
    );
};

export default InspectionPage;