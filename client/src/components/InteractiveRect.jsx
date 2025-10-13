// src/components/InteractiveRect.jsx (FINAL VERSION)

import React, { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva'; // <-- NOTE: Transformer is imported here

const InteractiveRect = ({ shapeProps, isSelected, onSelect, onChange, scaleX, scaleY }) => {
    const shapeRef = useRef(null);
    const trRef = useRef(null); // Ref for the Transformer node

    // Effect hook to attach/detach the Transformer when selection changes
    useEffect(() => {
        if (isSelected) {
            // Attach the transformer to the rect node
            if (trRef.current && shapeRef.current) {
                trRef.current.nodes([shapeRef.current]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [isSelected]);

    // Handles user moving the box (Drag End logic is correct for drag)
    const handleDragEnd = (e) => {
        const newX = e.target.x();
        const newY = e.target.y();

        const updatedShape = {
            ...shapeProps,
            location: {
                // Scale the final position back to the original image coordinates
                x_min: Math.round(newX / scaleX),
                y_min: Math.round(newY / scaleY),
                // Recalculate x_max, y_max based on the scaled width/height added to the new scaled position
                x_max: Math.round((newX + (shapeProps.location.x_max - shapeProps.location.x_min) * scaleX) / scaleX),
                y_max: Math.round((newY + (shapeProps.location.y_max - shapeProps.location.y_min) * scaleY) / scaleY)
            }
        };
        onChange(updatedShape);
    };

    // NEW HANDLER: Handles user resizing/transforming the box
    const handleTransformEnd = (e) => {
        const node = shapeRef.current;
        const parentScaleX = scaleX;
        const parentScaleY = scaleY;

        // Get the current dimensions/position from the Konva node
        const newX = node.x();
        const newY = node.y();
        const newWidth = node.width() * node.scaleX();
        const newHeight = node.height() * node.scaleY();

        // Reset scaling on the Konva node itself (this is CRITICAL)
        node.scaleX(1);
        node.scaleY(1);

        const updatedShape = {
            ...shapeProps,
            location: {
                // Scale the new top-left corner back to original size
                x_min: Math.round(newX / parentScaleX),
                y_min: Math.round(newY / parentScaleY),
                // Scale the new width/height back to original size
                x_max: Math.round((newX + newWidth) / parentScaleX),
                y_max: Math.round((newY + newHeight) / parentScaleY)
            }
        };
        onChange(updatedShape);
    };


    return (
        <React.Fragment>
            <Rect
                ref={shapeRef}
                x={shapeProps.location.x_min * scaleX}
                y={shapeProps.location.y_min * scaleY}
                width={(shapeProps.location.x_max - shapeProps.location.x_min) * scaleX}
                height={(shapeProps.location.y_max - shapeProps.location.y_min) * scaleY}

                stroke={shapeProps.type === 'Faulty' || shapeProps.type === 'User Added' ? 'blue' : 'yellow'}
                fill={isSelected ? 'rgba(255, 255, 0, 0.1)' : 'transparent'}
                strokeWidth={3}

                draggable
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd} // <-- ATTACH TRANSFORM END
            />

            {/* ADD THE TRANSFORMER NODE */}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    // Controls visibility and behavior of resizing handles
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size during transformation
                        if (newBox.width < 10 || newBox.height < 10) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            )}
        </React.Fragment>
    );
};

export default InteractiveRect;