import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getInspectionsByTransformer, createInspection } from '../services/apiService';
import { Button } from 'react-bootstrap';
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

    const fetchInspections = useCallback(async () => {
        try {
            const response = await getInspectionsByTransformer(transformerId);
            setInspections(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch inspections.');
            console.error(err);
            setLoading(false);
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
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Inspections for Transformer ID: {transformerId}</h2>
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