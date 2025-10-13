// src/components/AnomalyAnnotationCanvas.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Form, Card, Spinner } from 'react-bootstrap';
import axios from 'axios';
// Requires: npm install react-konva konva
import { Stage, Layer, Rect } from 'react-konva';
import InteractiveRect from './InteractiveRect'; // Assuming this file exists and is correctly implemented

const API_BASE_URL = 'http://localhost:8080';

const AnomalyAnnotationCanvas = ({ inspectionId, imagePath, initialAnnotationsJson, annotatorUser, onAnnotationSaved, originalImageDimensions }) => {


    const [annotations, setAnnotations] = useState([]);
    const [selectedId, selectAnnotation] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const imgRef = useRef(null);
    const stageRef = useRef(null);

    // Stores the calculated display dimensions and scale factor
    const [displaySize, setDisplaySize] = useState({
        width: 0,
        height: 0,
        scaleX: 1,
        scaleY: 1,
        scale: 1, // Retained for compatibility/simplicity
    });


    // --- 1. COORDINATE SCALING and IMAGE SIZE CALCULATION ---
    const handleRecalculateSize = useCallback(() => {
        const imgElement = imgRef.current;
        // CRITICAL: Get original dimensions from props (fetched by parent component)
        const originalWidth = originalImageDimensions?.original_width;
        const originalHeight = originalImageDimensions?.original_height;

        if (!imgElement || !originalWidth || !originalHeight) return;

        const displayWidth = imgElement.clientWidth;
        const displayHeight = imgElement.clientHeight;

        const scaleX = displayWidth / originalWidth;
        const scaleY = displayHeight / originalHeight;
        const unifiedScale = displayWidth / originalWidth;

        setDisplaySize({
            width: displayWidth,
            height: originalHeight*unifiedScale,
            scaleX: unifiedScale,
            scaleY: unifiedScale,
            scale: unifiedScale // Unified scale
        });
    }, [originalImageDimensions]);


    // Load initial annotations and set up resize listeners
    useEffect(() => {
        if (initialAnnotationsJson) {
            const initialList = JSON.parse(initialAnnotationsJson).map((a, index) => ({
                ...a,
                id: a.id || (Math.random().toString(36).substring(2, 9)),
                status: 'existing'
            }));
            setAnnotations(initialList);
        }

        const imgElement = imgRef.current;
        if (imgElement) {
            imgElement.addEventListener('load', handleRecalculateSize);
            if (imgElement.complete) handleRecalculateSize();
        }
        window.addEventListener('resize', handleRecalculateSize);

        return () => {
            if (imgElement) imgElement.removeEventListener('load', handleRecalculateSize);
            window.removeEventListener('resize', handleRecalculateSize);
        };
    }, [initialAnnotationsJson, handleRecalculateSize]);

    // Updates the properties (location/dimensions) of an existing shape
    const handleShapeChange = (updatedShape) => {
        setAnnotations(prev =>
            prev.map(a => (a.id === updatedShape.id ? updatedShape : a))
        );
    };

    // Deletes the currently selected annotation (FR3.1)
    const handleDelete = () => {
        if (selectedId !== null) {
            setAnnotations(prev => prev.filter(a => a.id !== selectedId));
            selectAnnotation(null);
        }
    };

    // --- DRAWING LOGIC (Adds a default, editable box) ---
    const handleAddBox = () => {
        const newId = Math.random().toString(36).substring(2, 9);
        // Create a new box at small, scaled coordinates for easy visibility/dragging
        const newBox = {
            id: newId,
            type: 'User Added',
            // Default position in original image coordinates
            location: { x_min: 50, y_min: 50, x_max: 200, y_max: 200 },
            confidence: 1.0,
            severity_score: 1.0,
            status: 'user_added'
        };
        setAnnotations(prev => [...prev, newBox]);
        selectAnnotation(newId); // Select the new box immediately so user can drag/resize it
    };
    // --------------------------------------------------------


    // --- Annotation Persistence Logic (FR3.2) ---
    const handleSaveAnnotations = async () => {
        setIsSaving(true);
        const inverseScaleX = 1 / displaySize.scaleX;
        const inverseScaleY = 1 / displaySize.scaleY;

        const requestData = {
            annotatorUser: annotatorUser,
            // 1. SCALING: Convert current display coordinates back to original image size
            finalAnnotations: annotations.map(a => ({
                type: a.type,
                location: {
                    x_min: Math.round(a.location.x_min * inverseScaleX),
                    y_min: Math.round(a.location.y_min * inverseScaleY),
                    x_max: Math.round(a.location.x_max * inverseScaleX),
                    y_max: Math.round(a.location.y_max * inverseScaleY)
                },
                confidence: a.confidence || 1.0,
                severity_score: a.severity_score || (a.type === 'Faulty' ? 2 : 1),
                // FR3.1: Log action taken
                action: a.status === 'existing' ? 'USER_EDITED' : 'USER_ADDED',
                notes: ''
            }))
        };

        try {
            // Call the PUT endpoint to save the final state and log feedback
            await axios.put(`${API_BASE_URL}/api/inspections/${inspectionId}/annotations`, requestData);
            onAnnotationSaved();
        } catch (error) {
            console.error('Failed to save annotations:', error);
            // Handle error toast
        } finally {
            setIsSaving(false);
        }
    };
    // ---------------------------------

    console.log('--- ANNOTATION CANVAS DEBUG ---');
    console.log('1. Original Dimensions Prop:', originalImageDimensions);
    console.log('2. Calculated Display Size:', displaySize);
    console.log('3. Is Data Loaded:', !!initialAnnotationsJson);
    console.log('-----------------------------');

    return (
        <Card>
            <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5>Interactive Annotation ({annotations.length} Boxes)</h5>
                    <div className="d-flex align-items-center">
                        {/* Add Button */}
                        <Button variant="info" size="sm" onClick={handleAddBox} disabled={isSaving} className="me-2">
                            <i className="bi bi-plus-square"></i> Add New Box
                        </Button>
                        {/* Delete Button */}
                        <Button variant="danger" size="sm" onClick={handleDelete} disabled={selectedId === null || isSaving} className="me-2">
                            <i className="bi bi-trash"></i> Delete Selected
                        </Button>
                        {/* Save Button */}
                        <Button variant="success" size="sm" onClick={handleSaveAnnotations} disabled={isSaving}>
                            {isSaving ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-save"></i>} Save Changes
                        </Button>
                    </div>
                </div>

                {/* Annotation Area */}
                <div style={{ position: 'relative', maxWidth: '1000px', margin: '0 auto' }}>

                    {/* 1. IMAGE LAYER */}
                    <img
                        ref={imgRef}
                        src={imagePath}
                        alt="Analyzed Image Background"
                        style={{ maxWidth: '100%', display: 'block' }}
                    />

                    {/* 2. KONVA STAGE OVERLAY */}
                    {displaySize.width > 0 && (
                        <Stage
                            ref={stageRef}
                            width={displaySize.width}
                            height={displaySize.height}
                            style={{ position: 'absolute', top: 0, left: 0 }}
                            // If user clicks on the stage but not a shape, deselect everything
                            onMouseDown={(e) => {
                                // If click target is the stage itself (not a shape)
                                if (e.target === stageRef.current) {
                                    selectAnnotation(null);
                                }
                            }}
                            onTap={(e) => {
                                if (e.target === stageRef.current) {
                                    selectAnnotation(null);
                                }
                            }}
                        >
                            <Layer>
                                {/* Render all annotation shapes */}
                                {annotations.map(a => (
                                    <InteractiveRect
                                        key={a.id}
                                        shapeProps={a}
                                        // Pass specific dimensions and handlers
                                        isSelected={a.id === selectedId}
                                        onSelect={() => selectAnnotation(a.id)}
                                        onChange={handleShapeChange}
                                        scaleX={displaySize.scaleX}
                                        scaleY={displaySize.scaleY}

                                        // Ensure the Konva node itself is passed down for transformer use
                                    />

                                ))}
                            </Layer>
                        </Stage>
                    )}

                    <div className="text-muted mt-2">
                         (Annotation editing is enabled.)

                    </div>
                </div>

            </Card.Body>
        </Card>
    );
};

export default AnomalyAnnotationCanvas;