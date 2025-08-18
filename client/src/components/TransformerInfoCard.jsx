import React from 'react';

const TransformerInfoCard = ({ transformer }) => {
    if (!transformer) {
        return null;
    }

    return (
        <div className="card mb-4">
            <div className="card-header">
                <h4>{transformer.transformerId}</h4>
            </div>
            <div className="card-body">
                <p><strong>Database ID:</strong> {transformer.id}</p>
                <p><strong>Location:</strong> {transformer.location}</p>
                <p><strong>Capacity:</strong> {transformer.capacity} kVA</p>
            </div>
        </div>
    );
};

export default TransformerInfoCard;