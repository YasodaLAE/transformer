import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const CommentModal = ({ show, action, onSave, onCancel, initialComment = '', annotationId }) => {
    const [comment, setComment] = useState(initialComment);

    // Reset comment when modal opens/closes
    React.useEffect(() => {
        setComment(initialComment);
    }, [initialComment, show]);

    const handleConfirm = () => {
        // Pass the comment back to the ImageAnnotator's handleCommentSave
        onSave(comment);
        setComment('');
    };

    const handleCancel = () => {
        onCancel();
        setComment('');
    };

    const title = action === 'DELETED'
        ? 'Confirm Deletion & Log'
        : 'Confirm Edit & Log';

    const buttonText = action === 'DELETED' ? 'Delete & Log' : 'Save & Log';

    return (
        <Modal show={show} onHide={handleCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>{action === 'DELETED'
                    ? `You are about to delete annotation ID: ${annotationId}. Please provide a reason for the log.`
                    : 'Please provide an optional comment explaining the changes to this annotation.'
                }</p>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter notes or reason here..."
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleCancel}>
                    Cancel
                </Button>
                <Button
                    variant={action === 'DELETED' ? 'danger' : 'primary'}
                    onClick={handleConfirm}
                    disabled={action === 'DELETED' && comment.trim() === ''} // Require comment for deletion
                >
                    {buttonText}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CommentModal;