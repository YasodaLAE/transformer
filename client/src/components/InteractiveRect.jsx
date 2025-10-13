// src/components/InteractiveRect.jsx (CORRECTED VERSION)

import React, { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';

const InteractiveRect = ({ shapeProps, isSelected, onSelect, onChange, scaleX, scaleY }) => {
    const shapeRef = useRef(null);
    const trRef = useRef(null);

    // Effect hook to attach/detach the Transformer when selection changes
    useEffect(() => {
        if (isSelected) {
            if (trRef.current && shapeRef.current) {
                // Attach the transformer to the rect node
                trRef.current.nodes([shapeRef.current]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [isSelected]);

    // Function to calculate the unscaled dimensions from the Konva node state
    const getUnscaledDimensions = (node) => {
        // Konva gives position in unscaled canvas coordinates
        const scaledX = node.x();
        const scaledY = node.y();

        // Konva gives width/height * base_scale * user_scale. Since base_scale is 1, we use user_scale.
        const scaledWidth = node.width() * node.scaleX();
        const scaledHeight = node.height() * node.scaleY();

        return {
            x_min: Math.round(scaledX / scaleX),
            y_min: Math.round(scaledY / scaleY),
            x_max: Math.round((scaledX + scaledWidth) / scaleX),
            y_max: Math.round((scaledY + scaledHeight) / scaleY)
        };
    };


    // Handles user moving the box (Drag End)
    const handleDragEnd = (e) => {
        const unscaledLocation = getUnscaledDimensions(e.target);

        const updatedShape = {
            ...shapeProps,
            location: unscaledLocation,
            status: shapeProps.status === 'user_added' ? 'user_added' : 'user_edited'
        };
        onChange(updatedShape);
    };

    // Handles user resizing/transforming the box
    const handleTransformEnd = (e) => {
        const node = shapeRef.current;

        // Reset scaling on the Konva node itself (CRITICAL)
        // This ensures subsequent rendering uses the rect's width/height, not scale factors.
        node.scaleX(1);
        node.scaleY(1);

        // Get the new dimensions after transformation, then calculate unscaled coords
        const unscaledLocation = getUnscaledDimensions(node);

        // Update the Konva node's width/height properties for next render cycle
        node.width(unscaledLocation.x_max - unscaledLocation.x_min);
        node.height(unscaledLocation.y_max - unscaledLocation.y_min);

        const updatedShape = {
            ...shapeProps,
            location: unscaledLocation,
            status: shapeProps.status === 'user_added' ? 'user_added' : 'user_edited'
        };
        onChange(updatedShape);
    };


    return (
        <React.Fragment>
            <Rect
                ref={shapeRef}
                // Initial positions are calculated based on unscaled data * scale factor
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
                onTransformEnd={handleTransformEnd}
            />

            {/* ADD THE TRANSFORMER NODE */}
            {isSelected && (
                <Transformer
                    ref={trRef}
                    enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width * newBox.scaleX < 10 || newBox.height * newBox.scaleY < 10) {
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