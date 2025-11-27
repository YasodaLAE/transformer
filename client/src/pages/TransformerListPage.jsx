import React, { useState, useEffect } from 'react';
import TransformerTable from '../components/TransformerTable';
import TransformerModal from '../components/TransformerModal';
import { getAllTransformers, createTransformer, updateTransformer, deleteTransformer } from '../services/apiService';
import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import PageNavButtons from '../components/PageNavButtons';

import Spinner from '../components/Spinner';
import Toast from '../components/Toast';

/**
 * Renders the main page displaying a list of all Transformer assets.
 * Provides functionality for searching, adding, editing, and deleting transformers (CRUD).
 */
const TransformerListPage = () => {
  // --- UI/Filter States ---
  const [searchTerm, setSearchTerm] = useState('');

  // --- Data States ---
  const [transformers, setTransformers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Modal/Editing States ---
  const [showModal, setShowModal] = useState(false);
  const [editingTransformer, setEditingTransformer] = useState(null);

  // --- Auth & Notification Hooks ---
  const { isAdmin } = useAuth();
  const [toast, setToast] = useState(null);
  const showError = (msg) => setToast({ type: 'error', message: msg });
  const showOk = (msg) => setToast({ type: 'success', message: msg });

  /**
   * Fetches all transformer records from the backend API.
   */
  const fetchTransformers = async () => {
    try {
      setLoading(true);
      const response = await getAllTransformers();
      setTransformers(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch transformers.');
      showError('Failed to load transformers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data only once on initial component mount
  useEffect(() => {
    fetchTransformers();
  }, []);

  /**
   * Filters the list of transformers based on the search term (ID, Region, or Type).
   */
  const filteredTransformers = transformers.filter(t =>
    (t.transformerId ?? '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.region ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.transformerType ?? '').toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Set state to open modal for adding a new transformer
  const handleOpenAddModal = () => {
    setEditingTransformer(null); // Clear editing state
    setShowModal(true);
  };

  // Set state to open modal for editing an existing transformer
  const handleOpenEditModal = (transformer) => {
    setEditingTransformer(transformer); // Pass current data to the modal
    setShowModal(true);
  };

  /**
   * Handles deletion of a transformer record.
   */
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this transformer? This cannot be undone.")) {
      try {
        await deleteTransformer(id);
        await fetchTransformers(); // Refresh data after successful deletion
        showOk('Transformer deleted');
      } catch (err) {
        console.error("Failed to delete transformer:", err);
        showError('Delete failed');
      }
    }
  };

  /**
   * Handles saving (creation or update) of transformer data.
   */
  const handleSave = async (transformerData) => {
    try {
      if (transformerData.id) {
        // Update existing transformer
        await updateTransformer(transformerData.id, transformerData);
        showOk('Transformer updated');
      } else {
        // Create new transformer
        await createTransformer(transformerData);
        showOk('Transformer created');
      }

      await fetchTransformers(); // Refresh data to show changes
      setShowModal(false); // Close modal
    } catch (err) {
      console.error("Failed to save transformer:", err);
      showError('Save failed');
    }
  };

  return (
    <div className="content-card">
      <div className="d-flex justify-content-between align-items-center mb-3">

        {/* Left-aligned group: Title and Add Button */}
        <div className="d-flex align-items-center gap-3">
          <h2 className="mb-0">Transformers</h2>
          {isAdmin && ( // Only show button for admin users
            <Button className="btn btn-primary" onClick={handleOpenAddModal}>
              Add Transformer
            </Button>
          )}
        </div>

        {/* Right-aligned group: Search bar and Navigation buttons */}
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
            {/* Component for navigation/active tab indicator */}
            <PageNavButtons activeTab="transformers" />
          </div>
        </div>
      </div>

      {/* Conditional Rendering of Data/Status */}
      {loading && <Spinner label="Loading transformers..." />}
      {!loading && error && <div className="text-danger">{error}</div>}

      {!loading && !error && (
        <TransformerTable
          transformers={filteredTransformers}
          onDelete={handleDelete}
          onEdit={handleOpenEditModal}
        />
      )}

      {/* Modal for adding/editing transformer details */}
      <TransformerModal
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSave={handleSave}
        transformer={editingTransformer}
      />

      {/* Global Toast Notification */}
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
};

export default TransformerListPage;