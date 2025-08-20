import React, { useState } from 'react';
import axios from 'axios';

// Assuming you pass the transformer's ID as a prop
const ThermalImageUpload = ({ transformerId }) => {
    const [file, setFile] = useState(null);
    const [condition, setCondition] = useState('Sunny'); // Default weather condition
    const [message, setMessage] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleConditionChange = (event) => {
        setCondition(event.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file) {
            setMessage('Please select a file to upload.');
            return;
        }

        // Use FormData to send files and text fields together
        const formData = new FormData();
        formData.append('file', file);
        formData.append('condition', condition);

        try {
            // Send the request to your new backend endpoint
            const response = await axios.post(
                `http://localhost:8080/api/transformers/${transformerId}/thermal-image`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );
            setMessage('Upload successful!');
            // Optionally, you can refresh the data or clear the form here
        } catch (error) {
            setMessage('Upload failed. Please try again.');
            console.error('Error uploading file:', error);
        }
    };

    return (
        <div>
            <h3>Thermal Image</h3>
            <p>Upload a thermal image of the transformer to identify potential issues.</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Weather Condition</label>
                    <select value={condition} onChange={handleConditionChange}>
                        <option value="Sunny">Sunny</option>
                        <option value="Cloudy">Cloudy</option>
                        <option value="Rainy">Rainy</option>
                    </select>
                </div>

                {/* You can style this file input to look nicer */}
                <input type="file" onChange={handleFileChange} />

                <button type="submit">Upload thermal image</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default ThermalImageUpload;