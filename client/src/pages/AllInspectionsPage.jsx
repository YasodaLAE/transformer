import React, { useState, useEffect } from 'react';
import InspectionTable from '../components/InspectionTable';
import { getAllInspections, deleteInspection } from '../services/apiService';
import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import AddInspectionModal from '../components/AddInspectionModal';

const AllInspectionsPage = () => {
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [inspectionToEdit, setInspectionToEdit] = useState(null); // New state for editing
    const { isAdmin } = useAuth();

    const fetchAllInspections = async () => {
        try {
            const response = await getAllInspections();
            setInspections(response.data);
            setLoading(false);
            setError(null);
        } catch (err) {
            setError('Failed to fetch inspections.');
            setLoading(false);
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAllInspections();
    }, []);

    // Handle opening the modal in "add" mode
    const handleOpenAddModal = () => {
        setInspectionToEdit(null); // Set to null for "add" mode
        setShowModal(true);
    };

    // Handle opening the modal in "edit" mode
    const handleOpenEditModal = (inspection) => {
        setInspectionToEdit(inspection); // Set the inspection to edit
        setShowModal(true);
    };

    // Handle closing the modal and refreshing data
    const handleCloseModal = () => {
        setShowModal(false);
        setInspectionToEdit(null); // Reset the state
        fetchAllInspections(); // Re-fetch all inspections to update the list
    };

    const handleDelete = async (inspectionId) => {
        if (window.confirm('Are you sure you want to delete this inspection?')) {
            try {
                await deleteInspection(inspectionId);
                // Optimistically update the UI by filtering out the deleted inspection
                setInspections(inspections.filter(inspection => inspection.id !== inspectionId));
                alert('Inspection deleted successfully!');
            } catch (error) {
                console.error('Failed to delete inspection:', error);
                alert('Failed to delete inspection. Please try again.');
            }
        }
    };

    if (loading) {
        return <p>Loading all inspections...</p>;
    }

    if (error) {
        return <p className="text-danger">{error}</p>;
    }

    return (
        <div className="content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>All Inspections</h2>
                {isAdmin && (
                    <Button onClick={handleOpenAddModal}>Add Inspection</Button>
                )}
            </div>
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={inspections}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                />
            ) : (
                <p>No inspections found.</p>
            )}

            <AddInspectionModal
                show={showModal}
                handleClose={handleCloseModal}
                onInspectionAdded={fetchAllInspections}
                // We pass the inspectionToEdit state to the modal
                inspectionToEdit={inspectionToEdit}
                // When adding a new inspection from here, the user needs to select a transformer.
                // The modal needs to handle this. We will not pass a transformerId from here.
            />
        </div>
    );
};

export default AllInspectionsPage;