import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { getAnnotations, saveAnnotations } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import Toast from './Toast';
import { Button, ButtonGroup } from 'react-bootstrap';

const AnnotationRect = ({ shapeProps, isSelected, onSelect, onChange }) => {
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    return (
        <>
            <Rect
                onClick={onSelect}
                onTap={onSelect}
                ref={shapeRef}
                {...shapeProps}
                draggable
                stroke="red"
                strokeWidth={2}
                onDragEnd={(e) => onChange({ ...shapeProps, x: e.target.x(), y: e.target.y() })}
                onTransformEnd={(e) => {
                    const node = shapeRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onChange({
                        ...shapeProps,
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(5, node.width() * scaleX),
                        height: Math.max(5, node.height() * scaleY),
                    });
                }}
            />
            {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width < 5 || newBox.height < 5 ? oldBox : newBox} />}
        </>
    );
};

const ImageAnnotator = ({ inspectionId, imageUrl, initialAnnotations, onAnnotationsSaved, onCancel }) => {
    const [annotations, setAnnotations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [image] = useImage(imageUrl);
    const { user } = useAuth();
    const [toast, setToast] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [newAnnotation, setNewAnnotation] = useState(null);

    const initialAnnotationsRef = useRef([]); // To hold the initial state for comparison
    const [loggableChanges, setLoggableChanges] = useState([]); // Array to store logs
    const [commentModal, setCommentModal] = useState({ show: false, action: null, annotationId: null, comment: '' });

    // Helper to generate a unique ID for new boxes
    const getNextNewId = () => `user_new-${annotations.filter(a => a.id.startsWith('user_new-')).length + 1}`;

    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    useEffect(() => {
        const loadAnnotations = async () => {
            try {
                const savedAnnotations = await getAnnotations(inspectionId);

                // If the API returns a non-empty array, it's the user's saved work.
                if (savedAnnotations && savedAnnotations.length > 0) {
                    const formatted = savedAnnotations.map(ann => ({ ...ann, id: ann.id.toString(), boxSessionId: ann.id.toString() }));
                                    setAnnotations(formatted);
                                    initialAnnotationsRef.current = formatted; // Store the initial state

                }
                // If the API returns an empty array, it means there are no saved annotations.
                // In this "first-time" case, we fall back to the AI's initial data.
                else if (initialAnnotations) {
                    const aiAnnotations = JSON.parse(initialAnnotations || '[]');
                    const formattedAnnotations = aiAnnotations.map((ann, index) => ({
                        id: `ai-${index}`,
                        boxSessionId: `ai-${index}`,
                        x: ann.location.x_min,
                        y: ann.location.y_min,
                        width: ann.location.x_max - ann.location.x_min,
                        height: ann.location.y_max - ann.location.y_min,
                        type: ann.type,
                        comments: '',
                    }));
                    setAnnotations(formattedAnnotations);
                    initialAnnotationsRef.current = formattedAnnotations; // Store the initial state
                }
            } catch (error) {
                // If the API call fails for any other reason, also try to fall back.
                console.warn("Could not fetch saved annotations, falling back to initial AI data.", error);
                 if (initialAnnotations) {
                    try {
                        const aiAnnotations = JSON.parse(initialAnnotations || '[]');
                        const formattedAnnotations = aiAnnotations.map((ann, index) => ({
                            id: `ai-${index}`,
                            x: ann.location.x_min,
                            y: ann.location.y_min,
                            width: ann.location.x_max - ann.location.x_min,
                            height: ann.location.y_max - ann.location.y_min,
                            type: ann.type,
                            comments: '',
                        }));
                        setAnnotations(formattedAnnotations);
                    } catch (parseError) {
                        console.error("Failed to parse initial AI annotations JSON:", parseError);
                    }
                 }
            }
        };

        loadAnnotations();
    }, [inspectionId, initialAnnotations]);


    const handleDelete = () => {
            if (selectedId) {
                setCommentModal({
                    show: true,
                    action: 'DELETED',
                    annotationId: selectedId,
                    comment: ''
                });
            }
        };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                handleDelete();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, annotations]);

    const handleSave = async () => {
            const userId = user ? user.username : 'unknown_user';
            const timestamp = new Date().toISOString();

            const finalAnnotationsToSave = annotations.map(ann => {
                // Determine if the ID is a transient session ID (like "ai-0" or "user_new-1")
                const isTransientId = typeof ann.id === 'string' && (ann.id.startsWith('ai-') || ann.id.startsWith('user_new-'));

                // Create a mutable copy
                const finalAnn = { ...ann, userId: userId };

                // 💥 FIX 1: Ensure the database 'id' field is only populated if it's a real DB ID (i.e., not a transient string).
                // If it's a transient ID, set it to null so Spring Boot knows it's a new entity.
                if (isTransientId) {
                    finalAnn.id = null; // Set Long field to null for new entity creation
                }

                // Remove logging-specific fields before final save
                finalAnn.actionType = undefined;
                finalAnn.originalState = undefined;

                return finalAnn;
            });

            const changesLog = loggableChanges.map(logEntry => {
                const finalLog = { ...logEntry };
                // 💥 FIX 2: Ensure the 'id' field in the loggableChanges DTO is null or a valid Long.
                // Since loggableChanges are DTOs that will be logged, they don't map directly to the
                // persistent Annotation entity ID. The only way to stop this is to ensure any
                // annotation sent in loggableChanges also has its id set to null if it's transient.
                if (typeof finalLog.id === 'string' && (finalLog.id.startsWith('ai-') || finalLog.id.startsWith('user_new-'))) {
                     finalLog.id = null;
                }
                return finalLog;
            });

            // 1. Check for ADDED boxes
            const addedAnnotations = annotations.filter(ann => ann.id.startsWith('user_new-'));
            addedAnnotations.forEach(ann => {
                 changesLog.push({
                    boxSessionId: ann.id,
                    userId: userId,
                    actionType: 'ADDED',
                    comments: ann.comments || '',
                    originalState: null, // No original state for an added box
                    ...ann, // The DTO itself is the final state
                    timestamp: timestamp,
                 });
            });

            try {
                 // Create the request body wrapper
                 const saveRequest = {
                     finalAnnotations: finalAnnotationsToSave,
                     loggableChanges: changesLog,
                 };

                 // You need to update apiService.js to handle the new saveAnnotations signature
                 await saveAnnotations(inspectionId, saveRequest);

                 showOk('Annotations saved and logged successfully!');
                 setTimeout(() => { if (onAnnotationsSaved) onAnnotationsSaved(); }, 1500);
            } catch (error) {
                 showErr('Failed to save annotations and logs.');
                 console.error("Save annotation error:", error);
            }
        };

    const handleCommentSave = (comment) => {
            const { action, annotationId, currentState, originalState } = commentModal;
            const userId = user ? user.username : 'unknown_user';
            const timestamp = new Date().toISOString();

            // Find the annotation in the current state
            const annotationToLog = annotations.find(ann => ann.id === annotationId);

            if (action === 'DELETED') {
                 // Annotation log for deletion
                 const originalBox = initialAnnotationsRef.current.find(ann => ann.id === annotationId) || annotationToLog;

                 setLoggableChanges(prev => [...prev, {
                     boxSessionId: annotationId,
                     userId: userId,
                     actionType: 'DELETED',
                     comments: comment,
                     originalState: originalBox, // The state that was deleted
                     timestamp: timestamp,
                 }]);

                 // Finally delete the annotation from the main list
                 setAnnotations(annotations.filter(ann => ann.id !== annotationId));
                 setSelectedId(null);

            } else if (action === 'EDITED') {
                // Annotation log for edit - the state comparison must be done here if it wasn't done on transformEnd
                // For simplicity in this demo, we rely on the modal being triggered at transformEnd or dragEnd
                 setLoggableChanges(prev => [...prev, {
                     boxSessionId: annotationId,
                     userId: userId,
                     actionType: 'EDITED',
                     comments: comment,
                     // The 'originalState' here is the state before the user started transforming/dragging.
                     originalState: originalState,
                     // The DTO itself will be the final state after the transformation
                     ...currentState,
                     timestamp: timestamp,
                 }]);
            }

            // If you need to update the comment on the main annotation state:
            // setAnnotations(prev => prev.map(ann => ann.id === annotationId ? { ...ann, comments: comment } : ann));

            setCommentModal({ show: false, action: null, annotationId: null, comment: '' });
        };

    const handleAnnotateChange = (newAttrs) => {
            setAnnotations(prev => {
                const index = prev.findIndex(r => r.id === newAttrs.id);
                if (index !== -1) {
                    const newRects = [...prev];
                    const originalAnnotation = newRects[index];

                    // Create a log entry if it's an EDIT action
                    if (!originalAnnotation.id.startsWith('user_new-')) { // Don't log moves/resizes for newly drawn boxes until final save
                         const isEdited = (originalAnnotation.x !== newAttrs.x || originalAnnotation.y !== newAttrs.y || originalAnnotation.width !== newAttrs.width || originalAnnotation.height !== newAttrs.height);

                         if (isEdited) {
                             // Open modal for comment on edit
                             setCommentModal({
                                 show: true,
                                 action: 'EDITED',
                                 annotationId: originalAnnotation.id,
                                 // Preserve the state before the final change
                                 currentState: newAttrs,
                                 originalState: originalAnnotation,
                                 comment: ''
                             });
                         }
                    }
                    newRects[index] = { ...originalAnnotation, ...newAttrs };
                    return newRects;
                }
                return prev;
            });
        };

    const handleMouseDown = (e) => {
        if (!isDrawing) {
            if (e.target === e.target.getStage()) {
                setSelectedId(null);
            }
            return;
        }
        const { x, y } = e.target.getStage().getPointerPosition();
        setNewAnnotation({ x, y, width: 0, height: 0, id: `new-${annotations.length + 1}` });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !newAnnotation) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        setNewAnnotation({ ...newAnnotation, width: x - newAnnotation.x, height: y - newAnnotation.y });
    };

    const handleMouseUp = () => {
        if (!isDrawing || !newAnnotation) return;
        if (Math.abs(newAnnotation.width) > 5 || Math.abs(newAnnotation.height) > 5) {
            const finalAnnotation = { ...newAnnotation, type: 'user_added' };
            if (finalAnnotation.width < 0) {
                finalAnnotation.x += finalAnnotation.width;
                finalAnnotation.width *= -1;
            }
            if (finalAnnotation.height < 0) {
                finalAnnotation.y += finalAnnotation.height;
                finalAnnotation.height *= -1;
            }
            setAnnotations([...annotations, finalAnnotation]);
        }
        setNewAnnotation(null);
        setIsDrawing(false);
    };

    return (
        <div>
            <Stage
                width={image ? image.width : 800}
                height={image ? image.height : 600}
                style={{ border: '1px solid grey', cursor: isDrawing ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <Layer>
                    <Image image={image} name="backgroundImage" />
                    {annotations.map((rect, i) => (
                        <AnnotationRect
                            key={rect.id || `ai-${i}`}
                            shapeProps={rect}
                            isSelected={(rect.id || `ai-${i}`) === selectedId}
                            onSelect={() => {
                                setIsDrawing(false);
                                setSelectedId(rect.id || `ai-${i}`);
                            }}
                            onChange={(newAttrs) => {
                                const rects = [...annotations];
                                const index = rects.findIndex(r => (r.id || `ai-${rects.indexOf(r)}`) === newAttrs.id);
                                if (index !== -1) {
                                    rects[index] = newAttrs;
                                    setAnnotations(rects);
                                }
                            }}
                        />
                    ))}
                    {newAnnotation && <Rect stroke="blue" strokeWidth={2} {...newAnnotation} />}
                </Layer>
            </Stage>

            <div className="d-flex justify-content-between align-items-center mt-3">
                <ButtonGroup size="sm">
                    <Button variant={isDrawing ? 'success' : 'outline-success'} onClick={() => { setIsDrawing(!isDrawing); setSelectedId(null); }}>
                        <i className="bi bi-plus-lg me-1" /> Add New Box
                    </Button>
                    <Button variant="outline-danger" onClick={handleDelete} disabled={!selectedId}>
                        <i className="bi bi-trash-fill me-1" /> Delete
                    </Button>
                </ButtonGroup>

                <ButtonGroup size="sm">
                    <Button variant="secondary" onClick={onCancel}>
                        Discard Changes
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save Annotations
                    </Button>
                </ButtonGroup>
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ImageAnnotator;