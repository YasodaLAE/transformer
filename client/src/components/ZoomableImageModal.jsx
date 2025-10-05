import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

// Modal component for interactive zoom/pan of analyzed images.
const ZoomableImageModal = ({ imageUrl, show, onClose, title }) => {

    return (
        <Modal show={show} onHide={onClose} size="xl" centered>
            <Modal.Header closeButton>
                <Modal.Title>{title} - Zoom Inspector</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0" style={{ height: '80vh', overflow: 'hidden' }}>

                {/* TransformWrapper: Initializes the zoom/pan context (required by library) */}
                <TransformWrapper
                    initialScale={1}
                    minScale={0.5}
                    maxScale={5} // Allow up to 5x zoom
                    initialPositionX={0}
                    initialPositionY={0}
                    // Enable click-and-drag movement (pan)
                    panning={{ disabled: false, velocity: false }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                        <React.Fragment>

                            {/* Controls Bar for Zoom/Reset */}
                            <div className="tools d-flex p-2 bg-light border-bottom sticky-top" style={{ zIndex: 10 }}>

                                {/* ZOOM IN BUTTON (+) */}
                                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => zoomIn()}>
                                    <i className="bi bi-plus-lg fw-bold"></i>
                                </Button>

                                {/* ZOOM OUT BUTTON (-) */}
                                <Button size="sm" variant="outline-dark" className="me-2" onClick={() => zoomOut()}>
                                    <i className="bi bi-dash-lg fw-bold"></i>
                                </Button>

                                {/* Reset Button */}
                                <Button size="sm" variant="outline-danger" onClick={() => resetTransform()}>
                                    <i className="bi bi-arrow-counterclockwise"></i> Reset
                                </Button>
                            </div>

                            {/* TransformComponent: Renders the actual image to be manipulated */}
                            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                                {/* Image tag, sized to fit the container initially */}
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