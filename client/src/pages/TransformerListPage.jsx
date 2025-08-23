import React, { useState, useEffect } from 'react';
import TransformerTable from '../components/TransformerTable';
import TransformerModal from '../components/TransformerModal';
import { getAllTransformers, createTransformer, updateTransformer, deleteTransformer } from '../services/apiService';
import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import PageNavButtons from '../components/PageNavButtons';

const TransformerListPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [transformers, setTransformers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingTransformer, setEditingTransformer] = useState(null);
    const { isAdmin } = useAuth();

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

    const filteredTransformers = transformers.filter(transformer =>
        transformer.transformerId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformer.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transformer.transformerType.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

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
        <div className="content-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-3">
                                <h2 className="mb-0">Transformers</h2>
                                {isAdmin && (
                                  <Button className="btn btn-primary" onClick={handleOpenAddModal}>
                                    Add Transformer
                                  </Button>
                                )}
                              </div>
                <div className="d-flex align-items-center gap-3">
                <input
                    type="text"
                    placeholder="Search by Transformer No., Region or Type"
                    className="form-control me-2"
                    style={{ maxWidth: '300px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              <div className="d-flex align-items-center">
                <PageNavButtons activeTab="transformers" />
              </div>
            </div>
            </div>
            {loading && <p>Loading transformers...</p>}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && (
                <TransformerTable
                    transformers={filteredTransformers}
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
        </div>
    );
};

export default TransformerListPage;