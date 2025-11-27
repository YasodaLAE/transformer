import React, { createContext, useState, useContext } from 'react';

//Create the Context
const TrainingStatusContext = createContext();

// Create the Provider Component
export const TrainingStatusProvider = ({ children }) => {
    // State to track if the training process is running
    const [isTraining, setIsTraining] = useState(false);

    // State to track the last outcome
    const [trainingStatus, setTrainingStatus] = useState(null);

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

// Create a Custom Hook for easy consumption
export const useTrainingStatus = () => {
    return useContext(TrainingStatusContext);
};