import React, { useState } from 'react';
import { Card, Button, Form } from 'react-bootstrap';

const NotesCard = ({ inspectionId, initialNotes, onSave, showOk, showErr, isAdmin }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentNotes, setCurrentNotes] = useState(initialNotes || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(inspectionId, currentNotes);
            setIsEditing(false);
            showOk('Notes saved successfully.');
        } catch (error) {
            showErr('Failed to save notes.');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelClick = () => {
        // Revert changes to initial state
        setCurrentNotes(initialNotes || '');
        setIsEditing(false);
    };

    const hasNotes = initialNotes && initialNotes.trim().length > 0;

    return (
        <Card className="mt-4 rounded-4 shadow-sm">
            <Card.Header as="h5" className="d-flex justify-content-between align-items-center bg-light">
                Inspector Notes

                {isAdmin && (
                    <div className="btn-group">
                        {!isEditing && (
                            <Button
                                variant={hasNotes ? "outline-primary" : "primary"}
                                size="sm"
                                onClick={handleEditClick}
                            >
                                {hasNotes ? 'Edit Notes' : 'Add Notes'}
                            </Button>
                        )}
                        {isEditing && (
                            <>
                                <Button
                                    variant="success"
                                    size="sm"
                                    onClick={handleSave}
                                    className="me-2"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Saving...' : 'Save'}
                                </Button>
                                <Button variant="secondary" size="sm" onClick={handleCancelClick} disabled={isSaving}>
                                    Cancel
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </Card.Header>
            <Card.Body>
                {isEditing ? (
                    <Form.Control
                        as="textarea"
                        rows={4}
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        placeholder="Add your detailed inspection notes here..."
                    />
                ) : (
                    <p className={hasNotes ? 'mb-0' : 'text-muted fst-italic mb-0'}>
                        {hasNotes ? initialNotes : 'No notes recorded for this inspection yet.'}
                    </p>
                )}
            </Card.Body>
        </Card>
    );
};

export default NotesCard;