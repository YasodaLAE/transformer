import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import TransformerTable from '../components/TransformerTable';
import TransformerModal from '../components/TransformerModal';
import Login from '../components/Login';
import { getAllTransformers, createTransformer, updateTransformer, deleteTransformer } from '../services/apiService';
import { Modal } from 'react-bootstrap';

const TransformerListPage = () => {
    const [transformers, setTransformers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTransformer, setEditingTransformer] = useState(null);
    const [showLoginModal, setShowLoginModal] = useState(false);

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

    return (
        <div className="container-fluid">
            <PageHeader
                title="Transformers"
                addLabel="Add Transformer"
                onAdd={handleOpenAddModal}
                onLogin={() => setShowLoginModal(true)}
            />

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
                <Modal.Body><Login onLoginSuccess={() => setShowLoginModal(false)} /></Modal.Body>
            </Modal>
        </div>
    );
};

export default TransformerListPage;