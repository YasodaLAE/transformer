import React, { useState, useEffect } from 'react';
import TransformerTable from '../components/TransformerTable';
import TransformerModal from '../components/TransformerModal'; // Use the new reusable modal
import Login from '../components/Login';
import { getAllTransformers, createTransformer, updateTransformer, deleteTransformer } from '../services/apiService';
import { Modal, Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';

const TransformerListPage = () => {
    const [transformers, setTransformers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTransformer, setEditingTransformer] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isAdmin, logout } = useAuth();

    const fetchTransformers = async () => {
        try {
            setLoading(true);
            const response = await getAllTransformers();
            setTransformers(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch transformers.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransformers();
    }, []);

    const handleOpenAddModal = () => {
        setEditingTransformer(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (transformer) => {
        setEditingTransformer(transformer);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this transformer?")) {
            try {
                await deleteTransformer(id);
                fetchTransformers();
            } catch (err) {
                console.error("Failed to delete transformer:", err);
            }
        }
    };

    const handleSave = async (transformerData) => {
        try {
            if (transformerData.id) {
                await updateTransformer(transformerData.id, transformerData);
            } else {
                await createTransformer(transformerData);
            }
            fetchTransformers();
            setShowModal(false);
        } catch (err) {
            console.error("Failed to save transformer:", err);
        }
    };

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformers</h2>
                <div>
                    {isAdmin ? (
                        <>
                            <Button className="btn btn-primary me-2" onClick={handleOpenAddModal}>Add Transformer</Button>
                            <Button className="btn btn-secondary" onClick={logout}>Logout</Button>
                        </>
                    ) : (
                        <Button variant="outline-primary" onClick={() => setShowLoginModal(true)}>Admin Login</Button>
                    )}
                </div>
            </div>

            {loading && <p>Loading transformers...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && (
                <TransformerTable
                    transformers={transformers}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                />
            )}

            <TransformerModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onSave={handleSave}
                transformer={editingTransformer}
            />

            <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
                <Modal.Header closeButton><Modal.Title>Admin Login</Modal.Title></Modal.Header>
                <Modal.Body><Login onLoginSuccess={handleLoginSuccess} /></Modal.Body>
            </Modal>
        </div>
    );
};

export default TransformerListPage;