import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { getAnnotations, saveAnnotations } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import Toast from './Toast';
import { Button, ButtonGroup } from 'react-bootstrap';
import CommentModal from './CommentModal';

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
            setAnnotations([]);
            initialAnnotationsRef.current = [];
            setSelectedId(null);
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
    }, [inspectionId, imageUrl, initialAnnotations]);


    const handleDelete = () => {
            // We no longer need the CommentModal logic for logging.
            // We will just remove the box and rely on the final save to record the deletion.
            if (selectedId) {
                if (window.confirm("Are you sure you want to delete this annotation box?")) {
                    setAnnotations(prev => prev.filter(ann => ann.id !== selectedId));
                    setSelectedId(null);
                    showOk('Annotation deleted locally. Click "Save Annotations" to finalize.');
                }
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
        const timestamp = new Date().toISOString(); // Sent as ISO string, Spring converts to LocalDateTime

        const finalAnnotationsToSave = annotations.map(ann => {
            // Determine if the ID is a transient session ID (like "ai-0" or "user_new-1")
            const isTransientId = typeof ann.id === 'string' && (ann.id.startsWith('ai-') || ann.id.startsWith('user_new-') || ann.id.startsWith('new-'));

            const finalAnn = {
                ...ann,
                // If it's a transient ID, set it to null for new entity creation.
                // If it's a number (DB ID), keep it so the backend can update the row.
                id: isTransientId ? null : ann.id,
                userId: userId,
                timestamp: timestamp,

                // Annotation Type will be set by the backend (USER_ADDED if id is null, USER_VALIDATED if id exists)
                // We keep the original 'type' here, the service overrides it.
            };

//             // Clean up transient fields
//             delete finalAnn.boxSessionId;
//             delete finalAnn.actionType;
//             delete finalAnn.originalState;

            return finalAnn;
        });

        // The saveAnnotations function only takes the final list
        try {
            await saveAnnotations(inspectionId, finalAnnotationsToSave);
            showOk('Annotations saved successfully!');
            if (onAnnotationsSaved) onAnnotationsSaved();
//             setTimeout(() => {
//                 if (onAnnotationsSaved) onAnnotationsSaved(finalAnnotationsToSave);
//             }, 1500);
        } catch (error) {
            showErr('Failed to save annotations.');
            console.error("Save annotation error:", error);
        }
    };

// ... existing code ...


    const handleAnnotateChange = (newAttrs) => {
            setAnnotations(prev => {
                const index = prev.findIndex(r => r.id === newAttrs.id);
                if (index !== -1) {
                    const newRects = [...prev];
                    const originalAnnotation = newRects[index];

                    // Check for movement/resize and update comments if needed (optional)
                    // For a simpler workflow, we just update the coordinates immediately.

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

{/*                 <ButtonGroup size="sm"> */}
{/*                     <Button variant="secondary" onClick={onCancel}> */}
{/*                         Discard Changes */}
{/*                     </Button> */}
{/*                     <Button variant="primary" onClick={handleSave}> */}
{/*                         Save Annotations */}
{/*                     </Button> */}
{/*                 </ButtonGroup> */}
            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">
{/*                 <ButtonGroup size="sm"> */}
{/*                      */}{/* ... Add New Box button ... */}
{/*                     <Button variant="outline-danger" onClick={handleDelete} disabled={!selectedId}> */}
{/*                         <i className="bi bi-trash-fill me-1" /> Delete */}
{/*                     </Button> */}
{/*                 </ButtonGroup> */}

                <ButtonGroup size="sm">
                    {/* ... Discard Changes button ... */}
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