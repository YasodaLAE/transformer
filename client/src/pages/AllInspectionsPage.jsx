import React, { useState, useEffect } from 'react';
import { getAllInspections, deleteInspection } from '../services/apiService';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import AddInspectionModal from '../components/AddInspectionModal';
import Login from '../components/Login';
import { Modal, Dropdown } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';

const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button ref={ref} onClick={e => { e.preventDefault(); onClick(e); }} className="btn btn-light btn-sm">
        {children}
    </button>
));

const AllInspectionsPage = () => {
    const [inspections, setInspections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [inspectionToEdit, setInspectionToEdit] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isAdmin } = useAuth();

    const fetchAllInspections = async () => {
        try {
            const response = await getAllInspections();
            setInspections(response.data);
        } catch (error) {
            console.error("Failed to fetch all inspections:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllInspections();
    }, []);

    const handleOpenAddModal = () => {
        setInspectionToEdit(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (inspection) => {
        setInspectionToEdit(inspection);
        setShowModal(true);
    };

    const handleDelete = async (inspectionId) => {
        if (window.confirm("Are you sure you want to delete this inspection?")) {
            try {
                await deleteInspection(inspectionId);
                fetchAllInspections(); // Refresh the data
            } catch (error) {
                console.error("Failed to delete inspection:", error);
            }
        }
    };

    const handleSave = () => {
        fetchAllInspections();
    };

    if (loading) return <p>Loading all inspections...</p>;

    return (
        <div className="container-fluid">
             <PageHeader
                title="All Inspections"
                addLabel="Add Inspection"
                onAdd={handleOpenAddModal}
                onLogin={() => setShowLoginModal(true)}
            />

            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Transformer No.</th>
                        <th>Inspection No.</th>
                        <th>Inspected Date</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {inspections.map(inspection => (
                        <tr key={inspection.id}>
                            <td>{inspection.transformerBusinessId}</td>
                            <td>{inspection.inspectionNo}</td>
                            <td>{new Date(inspection.inspectedDate).toLocaleDateString()}</td>
                            <td>{inspection.status}</td>
                            <td className="d-flex justify-content-end">
                                <Link to={`/inspection/${inspection.id}`} className="btn btn-primary btn-sm me-2">View</Link>
                                {isAdmin && (
                                    <Dropdown>
                                        <Dropdown.Toggle as={CustomToggle}>&#x22EE;</Dropdown.Toggle>
                                        <Dropdown.Menu align="end">
                                            <Dropdown.Item onClick={() => handleOpenEditModal(inspection)}>Edit</Dropdown.Item>
                                            <Dropdown.Item onClick={() => handleDelete(inspection.id)} className="text-danger">Delete</Dropdown.Item>
                                        </Dropdown.Menu>
                                    </Dropdown>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <AddInspectionModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onSave={handleSave}
                inspectionToEdit={inspectionToEdit}
            />

            <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
                <Modal.Header closeButton><Modal.Title>Admin Login</Modal.Title></Modal.Header>
                <Modal.Body><Login onLoginSuccess={() => setShowLoginModal(false)} /></Modal.Body>
            </Modal>
        </div>
    );
};

export default AllInspectionsPage;