import React from 'react';
import { Modal, Button } from 'react-bootstrap';
// Import the necessary components from your installed library
// Assuming you use 'react-zoom-pan-pinch' (install this!)
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const ZoomableImageModal = ({ imageUrl, show, onClose, title }) => {

    return (
        <Modal show={show} onHide={onClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>{title} - Zoom Inspector</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ height: '80vh', overflow: 'hidden' }}>

                {/* 1. TransformWrapper: Wraps the image and provides the zoom/pan context */}
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={5} // Allow up to 5x zoom
                    initialPositionX={0}
                    initialPositionY={0}
                    // Controls: Enable panning by default (click and drag)
                    panning={{ disabled: false, velocity: false }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <React.Fragment>

                            {/* Controls Bar for Zoom/Reset */}
                            <div className="tools d-flex p-2 bg-light border-bottom sticky-top" style={{ zIndex: 10 }}>

                                {/* ZOOM IN BUTTON: Now uses '+' icon */}
                                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => zoomIn()}>
                                    <i className="bi bi-plus-lg fw-bold"></i> {/* Bootstrap Plus Icon */}
                                </Button>

                                {/* ZOOM OUT BUTTON: Now uses '-' icon */}
                                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => zoomOut()}>
                                    <i className="bi bi-dash-lg fw-bold"></i> {/* Bootstrap Minus Icon */}
                                </Button>

                                {/* Reset Button (Kept) */}
                                <Button size="sm" variant="outline-danger" onClick={() => resetTransform()}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                                </Button>
                            </div>

                            {/* 2. TransformComponent: Renders the actual image */}
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                {/* Ensure the image takes up minimal space initially to allow proper zoom calculation */}
                                <img src={imageUrl} alt="Analyzed Image" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            </TransformComponent>

                        </React.Fragment>
                    )}
                </TransformWrapper>
            </Modal.Body>
        </Modal>
    );
};

export default ZoomableImageModal;