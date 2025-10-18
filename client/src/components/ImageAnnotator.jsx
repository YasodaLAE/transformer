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

    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    useEffect(() => {
        const loadAnnotations = async () => {
            try {
                const savedAnnotations = await getAnnotations(inspectionId);

                // If the API returns a non-empty array, it's the user's saved work.
                if (savedAnnotations && savedAnnotations.length > 0) {
                    setAnnotations(savedAnnotations.map(ann => ({ ...ann, id: ann.id.toString() })));
                }
                // If the API returns an empty array, it means there are no saved annotations.
                // In this "first-time" case, we fall back to the AI's initial data.
                else if (initialAnnotations) {
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
            setAnnotations(annotations.filter(ann => (ann.id || `ai-${annotations.indexOf(ann)}`) !== selectedId));
            setSelectedId(null);
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
        try {
            const annotationsToSave = annotations.map(({ id, ...rest }) => ({ ...rest, userId: user ? user.username : 'unknown_user' }));
            await saveAnnotations(inspectionId, annotationsToSave);
            showOk('Annotations saved successfully!');
            setTimeout(() => { if (onAnnotationsSaved) onAnnotationsSaved(); }, 1500);
        } catch (error) {
            showErr('Failed to save annotations.');
            console.error("Save annotation error:", error);
        }
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