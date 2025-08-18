// src/pages/TransformerListPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { getAllTransformers } from '../services/apiService';
import TransformerTable from '../components/TransformerTable';
import FilterBar from '../components/FilterBar';
import AddTransformerModal from '../components/AddTransformerModal';

const TransformerListPage = () => {
    const [transformer, setTransformer] = useState(null);
    const [showModal, setShowModal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


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
    },);

    useEffect(() => {
        fetchTransformers();
    },);

    const handleTransformerAdded = () => {
        // Refresh the list after a new transformer is added
        fetchTransformers();
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>Transformers</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    Add Transformer
                </button>
            </div>
            <FilterBar />

            {loading && <p>Loading transformers...</p>}
            {error && <p className="text-danger">{error}</p>}
            {!loading &&!error && <TransformerTable transformers={transformers} />}

            <AddTransformerModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                onTransformerAdded={handleTransformerAdded}
            />
        </div>
    );
};

export default TransformerListPage;