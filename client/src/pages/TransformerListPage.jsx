import React, { useState, useEffect, useCallback } from 'react';
import { getAllTransformers, deleteTransformer } from '../services/apiService';
import TransformerTable from '../components/TransformerTable';
import FilterBar from '../components/FilterBar';
import AddTransformerModal from '../components/AddTransformerModal';
import Login from '../components/Login';
import { Modal, Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext'; // Import the useAuth hook

const TransformerListPage = () => {
    const [transformers, setTransformers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

    // Use the useAuth hook to get isAdmin and login/logout functions
    const { isAdmin, login, logout } = useAuth();

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

    const handleDelete = async (id) => {
        try {
            await deleteTransformer(id);
            fetchTransformers();
        } catch (err) {
            console.error("Failed to delete transformer:", err);
            setError('Failed to delete transformer. Please try again.');
        }
    };

    const handleLoginSuccess = () => {
        // This function is called when the Login component successfully logs in
        setShowLoginModal(false); // Close the login modal
    };

    useEffect(() => {
        fetchTransformers();
    }, [fetchTransformers]);

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformers</h2>
                <div>
                    {isAdmin ? (
                        <>
                            <Button className="btn btn-primary me-2" onClick={() => setShowModal(true)}>
                                Add Transformer
                            </Button>
                            <Button className="btn btn-secondary" onClick={logout}>
                                Logout
                            </Button>
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

            {!loading && !error && (
                <TransformerTable
                    transformers={transformers}
                    onDelete={handleDelete}
                />
            )}

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
                    {/* Pass the onLoginSuccess function to the Login component */}
                    <Login onLoginSuccess={handleLoginSuccess} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default TransformerListPage;