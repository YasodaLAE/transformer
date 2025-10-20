import React, { createContext, useState, useContext } from 'react';

// 1. Create the Context
const TrainingStatusContext = createContext();

// 2. Create the Provider Component
export const TrainingStatusProvider = ({ children }) => {
    // State to track if the training process is running
    const [isTraining, setIsTraining] = useState(false);

    // State to track the last outcome: 'success', 'error', or null
    const [trainingStatus, setTrainingStatus] = useState(null);

    // This value will be provided to consuming components
    const value = {
        isTraining,
        setIsTraining,
        trainingStatus,
        setTrainingStatus,
    };

    return (
        <TrainingStatusContext.Provider value={value}>
            {children}
        </TrainingStatusContext.Provider>
    );
};

// 3. Create a Custom Hook for easy consumption
export const useTrainingStatus = () => {
    return useContext(TrainingStatusContext);
};