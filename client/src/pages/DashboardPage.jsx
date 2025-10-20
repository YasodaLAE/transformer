import React from 'react';
import { triggerModelFineTuning } from '../services/apiService';
// Import the custom hook
import { useTrainingStatus } from '../context/TrainingStatusContext.jsx';

/**
 * The main Dashboard component.
 */
const DashboardPage = () => {
    // Destructure the global state variables and setters from the context
    const { isTraining, setIsTraining, trainingStatus, setTrainingStatus } = useTrainingStatus();

    const handleFineTune = async () => {
        if (isTraining) return;

        // 1. Set global state to RUNNING (this persists across navigation)
        setIsTraining(true);
        setTrainingStatus(null);

        try {
            // 2. Blocking API call (waits for Python process to finish on server)
            const response = await triggerModelFineTuning();

            console.log("Fine-tuning completed:", response.data);

            // 3. Set global state to SUCCESS
            setIsTraining(false);
            setTrainingStatus('success');

        } catch (error) {
            console.error('Error during fine-tuning:', error);

            let message = 'Model fine-tuning failed. Please check server logs.';
            if (error.response && error.response.data) {
                // Use the error message returned from the Spring Boot body
                message = error.response.data;
            }

            // 4. Set global state to ERROR
            setIsTraining(false);
            setTrainingStatus('error');
            alert(message);
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
                {/* Conditional spinner only shows when isTraining is true */}
                {isTraining && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                {getButtonText()}
            </button>

            {/* Success Notification */}
            {trainingStatus === 'success' && (
                <div className="alert alert-success mt-3" role="alert">
                    The model fine-tuning process has successfully completed on the server!
                    A new model file has been saved to the configured output path.
                </div>
            )}

            {/* Error Notification */}
            {trainingStatus === 'error' && (
                <div className="alert alert-danger mt-3" role="alert">
                    Model fine-tuning failed. Please check the Spring Boot console for detailed Python errors.
                </div>
            )}
        </div>
    );
};

export default DashboardPage;