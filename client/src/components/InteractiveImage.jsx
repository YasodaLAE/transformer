import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'react-bootstrap';

const InteractiveImage = ({ imageUrl, anomalies, onSelect, selectedId, onDelete, isAdmin }) => {
    const imgRef = useRef(null);
    const [scale, setScale] = useState({ x: 1, y: 1 });
    const [isLoaded, setIsLoaded] = useState(false);

    // Parse the anomalies list
    let anomalyList = [];
    try {
        anomalyList = typeof anomalies === 'string' ? JSON.parse(anomalies) : anomalies;
    } catch (e) {
        console.error("Error parsing anomalies:", e);
    }
    if (!Array.isArray(anomalyList)) anomalyList = [];

    // Function to calculate the scale factor (Displayed Size / Original Size)
    const updateScale = () => {
        const img = imgRef.current;
        if (img && img.naturalWidth > 0) {
            const currentWidth = img.clientWidth;
            const currentHeight = img.clientHeight;

            setScale({
                x: currentWidth / img.naturalWidth,
                y: currentHeight / img.naturalHeight
            });
        }
    };

    // Update scale when image loads
    const handleImageLoad = () => {
        setIsLoaded(true);
        updateScale();
    };

    // Update scale when window resizes
    useEffect(() => {
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Update scale if the image URL changes
    useEffect(() => {
        if (isLoaded) updateScale();
    }, [imageUrl, isLoaded]);

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
            {/* The Image */}
            <img
                ref={imgRef}
                src={imageUrl}
                alt="Analyzed"
                onLoad={handleImageLoad}
                style={{ display: 'block', width: '100%', height: 'auto' }}
            />

            {/* The Overlay Boxes */}
            {isLoaded && anomalyList.map((anomaly, index) => {
                let x, y, w, h;

                // Extract raw coordinates
                if (anomaly.x !== undefined) {
                     x = anomaly.x; y = anomaly.y; w = anomaly.width; h = anomaly.height;
                } else if (anomaly.location) {
                    x = anomaly.location.x_min;
                    y = anomaly.location.y_min;
                    w = anomaly.location.x_max - anomaly.location.x_min;
                    h = anomaly.location.y_max - anomaly.location.y_min;
                } else {
                    return null;
                }

                // Apply Scale Factor
                const scaledX = x * scale.x;
                const scaledY = y * scale.y;
                const scaledW = w * scale.x;
                const scaledH = h * scale.y;

                const isSelected = (anomaly.id === selectedId);
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
                            left: `${scaledX}px`,
                            top: `${scaledY}px`,
                            width: `${scaledW}px`,
                            height: `${scaledH}px`,
                            border: `2px solid ${isSelected ? '#0dcaf0' : '#dc3545'}`,
                            backgroundColor: isSelected ? 'rgba(13, 202, 240, 0.2)' : 'transparent',
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        {/* Label */}
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
                                fontWeight: 'bold',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {index + 1}
                        </span>

                        {/* Delete Button */}
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