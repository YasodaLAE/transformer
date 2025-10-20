import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { getAnnotations, saveAnnotations } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import Toast from './Toast';
import { Button, ButtonGroup, Form, Card } from 'react-bootstrap';
import CommentModal from './CommentModal';

const AnnotationRect = ({ shapeProps, isSelected, onSelect, onChange, scale }) => {
    const shapeRef = useRef();
    const trRef = useRef();

    useEffect(() => {
        if (isSelected) {
            trRef.current.nodes([shapeRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const unscaleAttrs = (node) => {
            return {
                id: shapeProps.id, // Keep the ID
                x: node.x() / scale,
                y: node.y() / scale,
                width: node.width(),
                height: node.height(),
            };
        };

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
                    onDragEnd={(e) => {
                        const node = shapeRef.current;
                        // UN-SCALE before calling onChange
                        onChange({ ...shapeProps, ...unscaleAttrs(node) });
                    }}
                    onTransformEnd={(e) => {
                        const node = shapeRef.current;
                        const scaleX = node.scaleX();
                        const scaleY = node.scaleY();
                        // Reset scale to 1 on the node (Konva best practice)
                        node.scaleX(1);
                        node.scaleY(1);

                        // Calculate new UN-SCALED width/height and UN-SCALED x/y
                        onChange({
                            ...shapeProps,
                            id: shapeProps.id,
                            x: node.x() / scale,
                            y: node.y() / scale,
                            width: Math.max(5, (node.width() * scaleX) / scale), // Un-scale width
                            height: Math.max(5, (node.height() * scaleY) / scale), // Un-scale height
                        });
                    }}
                />
                {/* The Transformer itself should not be scaled, only the position/size of the shape */}
                {isSelected && <Transformer ref={trRef} boundBoxFunc={(oldBox, newBox) => newBox.width * scale < 5 || newBox.height * scale < 5 ? oldBox : newBox} />}
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
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
    const [scale, setScale] = useState(1);

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
                    const formatted = savedAnnotations.map(ann => ({ ...ann, id: ann.id.toString(), boxSessionId: ann.id.toString(),faultType: ann.faultType, }));
                                    setAnnotations(formatted);
                                    initialAnnotationsRef.current = formatted; // Store the initial state

                }
                // If the API returns an empty array, it means there are no saved annotations.
                // In this "first-time" case, we fall back to the AI's initial data.
                else if (initialAnnotations) {
                    const aiAnnotations = JSON.parse(initialAnnotations || '[]');
                    const formattedAnnotations = aiAnnotations.map((ann, index) => ({
                        id: `ai-${index}`,
                        originalSource: 'AI',
                        boxSessionId: `ai-${index}`,
                        x: ann.location.x_min,
                        y: ann.location.y_min,
                        width: ann.location.x_max - ann.location.x_min,
                        height: ann.location.y_max - ann.location.y_min,
                        aiConfidence: ann.confidence,
                        aiSeverityScore: ann.severity_score,
                        comments: '',
                        originalX: ann.location.x_min,
                        originalY: ann.location.y_min,
                        originalWidth: ann.location.x_max - ann.location.x_min,
                        originalHeight: ann.location.y_max - ann.location.y_min,
                        faultType: ann.type,
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
                            originalSource: 'AI',
                            x: ann.location.x_min,
                            y: ann.location.y_min,
                            width: ann.location.x_max - ann.location.x_min,
                            height: ann.location.y_max - ann.location.y_min,
                            aiConfidence: ann.confidence,
                            aiSeverityScore: ann.severity_score,
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

    // --- NEW HANDLER FOR FAULT TYPE CHANGE ---
        const handleFaultTypeChange = (e) => {
            const newFaultType = e.target.value;
            setAnnotations(prev => {
                const index = prev.findIndex(r => r.id === selectedId);
                if (index !== -1) {
                    const newRects = [...prev];
                    // Update the faultType field on the selected annotation
                    newRects[index] = { ...newRects[index], faultType: newFaultType };
                    return newRects;
                }
                return prev;
            });
        };
        // -----------------------------------------

    useEffect(() => {
            const handleKeyDown = (e) => {
                if (e.key === 'Delete' || e.key === 'Backspace') {
                    handleDelete();
                }
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [selectedId, annotations]);

    useEffect(() => {
            const calculateSize = () => {
                if (containerRef.current && image) {
                    // Get the width of the container (e.g., the browser window width or the parent div)
                    const containerWidth = containerRef.current.clientWidth;

                    // Calculate the height to maintain the aspect ratio
                    const containerHeight = containerWidth * (image.height / image.width);

                    setContainerSize({ width: containerWidth, height: containerHeight });

                    // Calculate the scale factor
                    const newScale = containerWidth / image.width;
                    setScale(newScale);
                }
            };

            // Initialize and listen for window resize
            calculateSize();
            window.addEventListener('resize', calculateSize);
            return () => window.removeEventListener('resize', calculateSize);
        }, [image]);

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
                faultType: ann.faultType,

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

            const savedAnnotations = await getAnnotations(inspectionId);
            const formatted = savedAnnotations.map(ann => ({
                        ...ann,
                        id: ann.id.toString(),
                        boxSessionId: ann.id.toString()
                    }));
                    setAnnotations(formatted);
                    initialAnnotationsRef.current = formatted; // Update initial state reference
                    setSelectedId(null); // Clear selected ID
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

        // Start new box creation with SCALED coordinates
        setNewAnnotation({ x, y, width: 0, height: 0, id: `new-${annotations.length + 1}` });
    };

    const handleMouseMove = (e) => {
        if (!isDrawing || !newAnnotation) return;
        const { x, y } = e.target.getStage().getPointerPosition();
        // Update new box with SCALED coordinates
        setNewAnnotation({ ...newAnnotation, width: x - newAnnotation.x, height: y - newAnnotation.y });
    };

    const handleMouseUp = () => {
            if (!isDrawing || !newAnnotation) return;
            if (Math.abs(newAnnotation.width) > 5 || Math.abs(newAnnotation.height) > 5) {

                // UN-SCALE the final box coordinates before saving to state
                let finalAnnotation = {
                    ...newAnnotation,
                    x: newAnnotation.x / scale,
                    y: newAnnotation.y / scale,
                    width: newAnnotation.width / scale,
                    height: newAnnotation.height / scale,
                    currentStatus: 'PENDING_SAVE',
                    originalSource: 'USER',
                    aiConfidence: null,
                    aiSeverityScore: null,
                    faultType: null,
                };

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

    const selectedAnnotation = annotations.find(a => a.id === selectedId);

    const handleCommentChange = (e) => {
        const newComment = e.target.value;
        setAnnotations(prev => {
            const index = prev.findIndex(r => r.id === selectedId);
            if (index !== -1) {
                const newRects = [...prev];
                // Update the comments field on the selected annotation
                newRects[index] = { ...newRects[index], comments: newComment };
                return newRects;
            }
            return prev;
        });
    };

    return (
        <div ref={containerRef} style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>
            <Stage
                width={containerSize.width} // Use container's calculated width
                height={containerSize.height} // Use container's calculated height
                style={{ border: '1px solid grey', cursor: isDrawing ? 'crosshair' : 'default' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <Layer>
                    <Image
                        image={image}
                        name="backgroundImage"
                        scaleX={scale} // <-- Apply the scale here
                        scaleY={scale} // <-- Apply the scale here
                        width={image ? image.width : 0} // Konva image dimensions should be raw
                        height={image ? image.height : 0} // Konva image dimensions should be raw
                    />
                    {annotations.map((rect, i) => (
                        <AnnotationRect
                            key={rect.id || `ai-${i}`}
                            scale={scale}
                            shapeProps={{
                                ...rect,
                                // Scale down the annotation coordinates and dimensions
                                x: rect.x * scale,
                                y: rect.y * scale,
                                width: rect.width * scale,
                                height: rect.height * scale,
                                // Note: The original unscaled values are still in `rect`
                            }}
                            isSelected={(rect.id || `ai-${i}`) === selectedId}
                            onSelect={() => {
                                setIsDrawing(false);
                                setSelectedId(rect.id || `ai-${i}`);
                            }}
//                             onChange={(newAttrs) => {
//                                 // IMPORTANT: When changing, scale back up to save original coordinates!
//                                 const unscaledAttrs = {
//                                     ...newAttrs,
//                                     x: newAttrs.x / scale,
//                                     y: newAttrs.y / scale,
//                                     width: newAttrs.width / scale,
//                                     height: newAttrs.height / scale,
//                                 };
//                                 handleAnnotateChange(unscaledAttrs); // Your existing handler needs to be updated too!
//                             }
                        onChange={handleAnnotateChange}

                        />
                    ))}
                    {/* New annotation is drawn with SCALED coordinates */}
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

            </div>

            <div className="d-flex justify-content-between align-items-center mt-3">

            </div>

            {selectedAnnotation && (
                <Card className="mt-3 shadow-sm border-info">
                    <Card.Body>
                        <Card.Title className="mb-2 d-flex justify-content-between align-items-center">
                            Edit Annotation Details (Box ID: {selectedAnnotation.id.toString().replace('user_new-', 'NEW-')})
                            <small className="text-muted">Source: {selectedAnnotation.originalSource}</small>
                        </Card.Title>

                        {/* --- NEW FAULT TYPE DROPDOWN --- */}
                        <Form.Group className="mb-3" controlId="faultType">
                            <Form.Label className="small fw-bold">Fault Type:</Form.Label>
                            <Form.Control
                                as="select"
                                value={selectedAnnotation.faultType || ''}
                                onChange={handleFaultTypeChange}
                            >
                                <option value="" disabled>Select Fault Type</option>
                                <option value="Faulty">Faulty</option>
                                <option value="Potentially Faulty">Potentially Faulty</option>

                            </Form.Control>
                        </Form.Group>
                        <Form.Group className="mb-1" controlId="annotationComments">
                            <Form.Label className="small fw-bold">Optional Comments/Notes:</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={selectedAnnotation.comments || ''}
                                onChange={handleCommentChange}
                                placeholder="Add comments, detailed findings, or modification reasons here..."
                            />
                        </Form.Group>
                        <small className="text-muted d-block mt-2">
                            * Changes to comments, size, or position will be saved when you click "Save Annotations".
                        </small>
                    </Card.Body>
                </Card>
            )}

            <div className="d-flex justify-content-end mt-3">
                <ButtonGroup size="sm">
                        <Button variant="secondary" onClick={onCancel}>
                            Discard Changes
                        </Button>

                                </ButtonGroup>
                <ButtonGroup size="sm">
{/*                     <Button variant="secondary" onClick={onCancel}> */}
{/*                         Discard Changes */}
{/*                     </Button> */}
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