import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { getAnnotations, saveAnnotations } from '../services/apiService';
import { useAuth } from '../hooks/AuthContext';
import Toast from './Toast'; // Make sure the path to your Toast component is correct

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

    const showOk = (m) => setToast({ type: 'success', message: m });
    const showErr = (m) => setToast({ type: 'error', message: m });

    useEffect(() => {
        const loadAnnotations = async () => {
            let loadedFromApi = false;
            try {
                const savedAnnotations = await getAnnotations(inspectionId);
                if (savedAnnotations && savedAnnotations.length > 0) {
                    setAnnotations(savedAnnotations.map(ann => ({ ...ann, id: ann.id.toString() })));
                    loadedFromApi = true;
                }
            } catch (error) {
                console.warn("Could not fetch saved annotations, falling back to initial data.", error);
            }

            if (!loadedFromApi && initialAnnotations) {
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
                    console.error("Failed to parse initial annotations JSON:", parseError);
                }
            }
        };
        loadAnnotations();
    }, [inspectionId, initialAnnotations]);

    const handleSave = async () => {
        try {
            const annotationsToSave = annotations.map(({ id, ...rest }) => ({
                ...rest,
                userId: user ? user.username : 'unknown_user',
            }));
            await saveAnnotations(inspectionId, annotationsToSave);
            showOk('Annotations saved successfully!');

            setTimeout(() => {
                if (onAnnotationsSaved) {
                    onAnnotationsSaved();
                }
            }, 1500);
        } catch (error) {
            showErr('Failed to save annotations.');
            console.error("Save annotation error:", error);
        }
    };

    return (
        <div>
            <Stage width={image ? image.width : 800} height={image ? image.height : 600} style={{ border: '1px solid grey' }} onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}>
                <Layer>
                    <Image image={image} />
                    {annotations.map((rect, i) => <AnnotationRect key={rect.id || i} shapeProps={rect} isSelected={(rect.id || `ai-${i}`) === selectedId} onSelect={() => setSelectedId(rect.id || `ai-${i}`)} onChange={(newAttrs) => { const rects = annotations.slice(); rects[i] = newAttrs; setAnnotations(rects); }} />)}
                </Layer>
            </Stage>

            {/* --- THIS IS THE ONLY CHANGED LINE --- */}
            <div className="d-flex justify-content-end mt-2">
                <button className="btn btn-secondary" onClick={onCancel}>Discard Changes</button>
                <button className="btn btn-primary ms-2" onClick={handleSave}>Save Annotations</button>
            </div>

            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ImageAnnotator;