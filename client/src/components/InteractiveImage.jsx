import React from 'react';
import { Button } from 'react-bootstrap';

const InteractiveImage = ({ imageUrl, anomalies, onSelect, selectedId, onDelete, isAdmin }) => {
    // Ensure anomalies is an array. It might come in as a JSON string or an object.
    let anomalyList = [];
    try {
        anomalyList = typeof anomalies === 'string' ? JSON.parse(anomalies) : anomalies;
    } catch (e) {
        console.error("Error parsing anomalies for interactive image:", e);
        anomalyList = [];
    }

    if (!Array.isArray(anomalyList)) {
        anomalyList = [];
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            {/* The Image */}
            <img
                src={imageUrl}
                alt="Analyzed"
                style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
            />

            {/* The Overlay Boxes */}
            {anomalyList.map((anomaly, index) => {
                // Handle both raw AI data (location object) and saved data (x, y fields)
                let x, y, w, h;

                if (anomaly.x !== undefined) {
                     // Format: Saved Annotation
                     x = anomaly.x;
                     y = anomaly.y;
                     w = anomaly.width;
                     h = anomaly.height;
                } else if (anomaly.location) {
                    // Format: Raw AI Result
                    x = anomaly.location.x_min;
                    y = anomaly.location.y_min;
                    w = anomaly.location.x_max - anomaly.location.x_min;
                    h = anomaly.location.y_max - anomaly.location.y_min;
                } else {
                    return null;
                }

                const isSelected = (anomaly.id === selectedId);
                // Use index as fallback key if id is missing
                const key = anomaly.id || index;

                return (
                    <div
                        key={key}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSelect) onSelect(anomaly.id);
                        }}
                        style={{
                            position: 'absolute',
                            left: `${x}px`,
                            top: `${y}px`,
                            width: `${w}px`,
                            height: `${h}px`,
                            border: `2px solid ${isSelected ? '#0dcaf0' : '#dc3545'}`, // Cyan if selected, Red if not
                            backgroundColor: isSelected ? 'rgba(13, 202, 240, 0.2)' : 'transparent',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        {/* Label (Index 1, 2, 3...) */}
                        <span
                            style={{
                                position: 'absolute',
                                top: '-20px',
                                left: '0',
                                background: isSelected ? '#0dcaf0' : '#dc3545',
                                color: 'white',
                                fontSize: '10px',
                                padding: '1px 4px',
                                borderRadius: '2px',
                                fontWeight: 'bold'
                            }}
                        >
                            {/* CHANGE: Display index + 1 instead of database ID */}
                            {index + 1}
                        </span>

                        {/* Delete Button (Only visible if selected and isAdmin) */}
                        {isSelected && isAdmin && onDelete && (
                            <Button
                                variant="danger"
                                size="sm"
                                style={{
                                    position: 'absolute',
                                    top: '-35px',
                                    right: '-10px',
                                    padding: '2px 6px',
                                    fontSize: '12px',
                                    zIndex: 20,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(anomaly.id);
                                }}
                            >
                                Delete
                            </Button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default InteractiveImage;