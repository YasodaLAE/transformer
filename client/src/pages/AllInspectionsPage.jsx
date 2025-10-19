import React, { useState, useEffect } from 'react';
import InspectionTable from '../components/InspectionTable';
import { getAllInspections, deleteInspection, getAllTransformers, exportAllFeedbackLog } from '../services/apiService';
import { Button } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext';
import AddInspectionModal from '../components/AddInspectionModal';
import PageNavButtons from '../components/PageNavButtons'; // Component for navigation/filtering (imported but not shown)
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';


/**
 * Main page component to display a list of all inspections across all transformers.
 * It handles data fetching, state management for adding/editing, searching, and deleting records.
 */
const AllInspectionsPage = () => {
    // State for storing fetched data
    const [transformers, setTransformers] = useState([]);
    const [inspections, setInspections] = useState([]);

    // UI/Loading State
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [inspectionToEdit, setInspectionToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Authentication and Notification Hooks
    const { isAdmin } = useAuth();
    const [toast, setToast] = useState(null);
    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });


    /**
     * Fetches all inspections and all transformers concurrently and links them.
     */
    const fetchAllData = async () => {
        try {
            // Fetch both data sets in parallel for efficiency
            const [inspectionsResponse, transformersResponse] = await Promise.all([
                getAllInspections(),
                getAllTransformers()
            ]);

            setTransformers(transformersResponse.data);

            // Create a quick lookup map (Transformer ID -> Transformer Object)
            const transformerMap = transformersResponse.data.reduce((map, transformer) => {
                map[transformer.id] = transformer; // Assuming transformerId in DTO is now transformer.id
                return map;
            }, {});

            // Combine inspections with their corresponding transformer data for the table
            const combinedInspections = inspectionsResponse.data.map(inspection => ({
                ...inspection,
                // Attach the transformer object to the inspection for easy access in the table
                transformer: transformerMap[inspection.transformerDbId] || null
            }));

            setInspections(combinedInspections);
            setLoading(false);
            setError(null);
        } catch (err) {
            setError('Failed to fetch inspections.');
            setLoading(false);
            console.error(err);
        }
    };

    // Run data fetching only once on component mount
    useEffect(() => {
        fetchAllData();
    }, []);

    // Filter inspections based on the search term (Transformer ID)
    const filteredInspections = inspections.filter(inspection =>
        (inspection.transformer?.transformerId?.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleExportAllFeedback = async () => {
            try {
                showOk('Preparing global anomaly data for download...');

                // Get the Blob object from the backend
                const response = await exportAllFeedbackLog();
                const blob = new Blob([response.data], { type: 'application/json' });

                // Trigger file download
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `all_anomaly_feedback_${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();

                window.URL.revokeObjectURL(url);
                a.remove();

                showOk('Global anomaly data successfully exported!');
            } catch (err) {
                console.error("Export error:", err);
                showErr('Failed to export global anomaly data. Check network connection or server logs.');
            }
        };

    // Handles modal opening for creating a new inspection
    const handleOpenAddModal = () => {
        setInspectionToEdit(null); // Explicitly set to null for 'Add' mode
        setShowModal(true);
    };

    // Handles modal opening for editing an existing inspection
    const handleOpenEditModal = (inspection) => {
        setInspectionToEdit(inspection); // Pass the inspection data for pre-filling the form
        setShowModal(true);
    };

    // Closes the modal and triggers a full data refresh
    const handleCloseModal = () => {
        setShowModal(false);
        setInspectionToEdit(null);
        fetchAllData();
    };

    /**
     * Handles the deletion of an inspection record.
     */
    const handleDelete = async (inspectionId) => {
      if (window.confirm('Are you sure you want to delete this inspection? This will also delete all associated images/results.')) {
        try {
          await deleteInspection(inspectionId);
          // Optimistically update the list by filtering out the deleted item
          setInspections(prev => prev.filter(i => i.id !== inspectionId));
          showOk('Inspection deleted');
        } catch (error) {
          console.error('Failed to delete inspection:', error);
          showErr('Failed to delete inspection. Check server logs.');
          fetchAllData(); // Re-fetch data to restore list state if optimistic update failed
        }
      }
    };


    if (loading) return <Spinner label="Loading all inspections..." />;

    if (error) {
        return <p className="text-danger">{error}</p>;
    }


    return (
        <div className="content-card">
                 <div className="d-flex justify-content-between align-items-center mb-3">
                     {/* Left-aligned group: Heading and Add button */}
                     <div className="d-flex align-items-center gap-2">
                         <h2 className="mb-0">All Inspections</h2>
                         {isAdmin && (
                             <>
                              <Button onClick={handleOpenAddModal}>Add Inspection</Button>

                              {/* 💥 NEW BUTTON */}
                              <Button
                                  variant="outline-primary"
                                  onClick={handleExportAllFeedback}
                              >
                                  <i className="bi bi-download me-1"></i>
                                  Export All Anomaly Data
                              </Button>
                          </>
                         )}
                     </div>

                     {/* Right-aligned group: Search bar and Navigation buttons */}
                     <div className="d-flex align-items-center gap-3">
                         <input
                             type="text"
                             placeholder="Search by Transformer No."
                             className="form-control"
                             style={{ maxWidth: '300px' }}
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                         />
                         <div className="d-flex align-items-center">
                         {/* Navigation component (e.g., to switch to Transformer list view) */}
                         <PageNavButtons activeTab="inspections" />
                         </div>
                     </div>
                 </div>
            {inspections.length > 0 ? (
                <InspectionTable
                    inspections={filteredInspections}
                    onDelete={handleDelete}
                    onEdit={handleOpenEditModal}
                    // Since this is the "All Inspections" page, we want to show the Transformer column
                    showTransformerColumn={true}
                />
            ) : (
                <p>No inspections found.</p>
            )}

            {/* Modal for Adding/Editing Inspections */}
            <AddInspectionModal
              show={showModal}
              handleClose={handleCloseModal}
              onInspectionAdded={(mode) => {
                if (mode === 'created') showOk('Inspection created successfully!');
                else if (mode === 'updated') showOk('Inspection updated successfully!');
                fetchAllData(); // Full refresh ensures data and totals are correct
              }}
              inspectionToEdit={inspectionToEdit}
              allTransformers={transformers} // Pass the full list for the dropdown selector
            />


            {/* Global Toast Notification Component */}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>


    );
};

export default AllInspectionsPage;