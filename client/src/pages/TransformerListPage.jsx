import React, { useState, useEffect, useCallback } from 'react';
import { getAllTransformers, deleteTransformer } from '../services/apiService';
import TransformerTable from '../components/TransformerTable';
import FilterBar from '../components/FilterBar';
import AddTransformerModal from '../components/AddTransformerModal';
import Login from '../components/Login';
import { Modal, Button } from 'react-bootstrap';

const TransformerListPage = () => {
    const [transformers, setTransformers] = useState(null);
    const [showModal, setShowModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false); // New state for authentication
    const [showLoginModal, setShowLoginModal] = useState(false); // New state for login modal

    const fetchTransformers = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAllTransformers();
            setTransformers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch transformers. Please ensure the backend is running and accessible.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleTransformerAdded = () => {
        fetchTransformers();
    };

    // New delete function
    const handleDelete = async (id) => {
        try {
            await deleteTransformer(id);
            fetchTransformers(); // Refresh the list after successful deletion
        } catch (err) {
            console.error("Failed to delete transformer:", err);
            setError('Failed to delete transformer. Please try again.');
        }
    };

    const handleLoginSuccess = () => {
            setIsLoggedIn(true);
            setShowLoginModal(false);
    };

    const handleLogout = () => {
            setIsLoggedIn(false);
    };

    useEffect(() => {
        fetchTransformers();
    }, [fetchTransformers]);


    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformers</h2>
                <div>
                    {isLoggedIn ? (
                        <>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Add Transformer
                    </button>
                    <button className="btn btn-secondary" onClick={handleLogout}>
                        Logout
                    </button>
                    </>
                    ) : (
                    <Button variant="outline-primary" onClick={() => setShowLoginModal(true)}>
                                                Admin Login
                                            </Button>
                    )}
                </div>
            </div>
            <FilterBar />

            {loading && <p>Loading transformers...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading && !error && (<TransformerTable transformers={transformers} onDelete={isLoggedIn ? handleDelete : null} />)}
            <AddTransformerModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onTransformerAdded={handleTransformerAdded}
            />
            <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title>Admin Login</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Login onLoginSuccess={handleLoginSuccess} />
                    </Modal.Body>
            </Modal>

        </div>
    );
};

export default TransformerListPage;