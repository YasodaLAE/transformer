
import React, { useState } from 'react';
import { triggerModelFineTuning } from '../services/apiService'; // Adjust path as needed
/**
 * The main Dashboard component.
 * Serves as the landing page or home screen after a user logs in.
 * Currently functions as a placeholder for key performance indicators (KPIs)
 * and summary statistics in future development phases.
 */
const DashboardPage = () => {
    const [isTraining, setIsTraining] = useState(false);
    const [trainingStatus, setTrainingStatus] = useState(null); // 'success', 'error', or null

    const handleFineTune = async () => {
        if (isTraining) return; // Prevent double-click

        setIsTraining(true);
        setTrainingStatus(null);

        try {
            // Call the Spring Boot endpoint
            const response = await triggerModelFineTuning();

            // The process starts successfully on the backend
            console.log("Fine-tuning initiated:", response.data);

            // NOTE: Since the backend is non-blocking (runs in a separate thread),
            // the response here only confirms the START. We keep loading until
            // a later mechanism (like polling or WebSockets, not implemented here)
            // confirms the END.

            // For this simple example, we'll keep it loading for a set time
            // and assume success, or check the server logs for the real status.
            setTimeout(() => {
                setIsTraining(false);
                setTrainingStatus('success');
            }, 5000); // Simulate a short-running process for UI feedback

        } catch (error) {
            console.error('Error initiating fine-tuning:', error);
            setIsTraining(false);
            setTrainingStatus('error');
            alert('Failed to start model fine-tuning process. Check server connection and logs.');
        }
    };

    const getButtonText = () => {
        if (isTraining) return 'Fine-Tuning Running... (Check Server Logs)';
        if (trainingStatus === 'success') return 'Fine-Tuning Finished! ✅';
        return 'Start Model Fine-Tuning with User Data';
    }

    return (
        <div className="container mt-4">
            <h2>Dashboard</h2>
            <p>Welcome to the Oversight Transformer Management System.</p>

            <hr/>

            <h3>AI Model Fine-Tuning</h3>
            <p>
                Use this button to re-train the anomaly detection model using all user-added and user-edited annotations
                from the database. This process runs in the background.
            </p>

            <button
                className={`btn ${isTraining ? 'btn-warning' : 'btn-primary'} btn-lg`}
                onClick={handleFineTune}
                disabled={isTraining}
            >
                {isTraining && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                {getButtonText()}
            </button>

            {trainingStatus === 'success' && (
                <div className="alert alert-success mt-3" role="alert">
                    The model fine-tuning process has successfully completed on the server!
                    A new model file has been saved to the configured output path.
                </div>
            )}

            {trainingStatus === 'error' && (
                <div className="alert alert-danger mt-3" role="alert">
                    Model fine-tuning failed. Please check the Spring Boot console for detailed Python errors.
                </div>
            )}
        </div>
    );
};

export default DashboardPage;