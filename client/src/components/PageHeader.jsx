import React from 'react';
import { Dropdown, Button } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';

const PageHeader = ({ title, onAdd, addLabel, onLogin }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAdmin, logout } = useAuth();

    const isTransformersPage = location.pathname.startsWith('/transformers');
    const isInspectionsPage = location.pathname.startsWith('/inspections');

    return (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
                <Dropdown>
                    <Dropdown.Toggle variant="light" id="dropdown-basic" className="me-3">
                        ☰
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                        <Dropdown.Item onClick={() => navigate('/transformers')}>Transformers</Dropdown.Item>
                        <Dropdown.Item onClick={() => navigate('/inspections')}>All Inspections</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
                <h2 className="mb-0">{title}</h2>
            </div>

            <div className="btn-group">
                <button className={`btn ${isTransformersPage ? 'btn-primary' : 'btn-light'}`}>
                    Transformers
                </button>
                <button className={`btn ${isInspectionsPage ? 'btn-primary' : 'btn-light'}`}>
                    Inspections
                </button>
            </div>

            <div>
                {isAdmin ? (
                    <>
                        <Button className="btn btn-primary me-2" onClick={onAdd}>
                            {addLabel}
                        </Button>
                        <Button className="btn btn-secondary" onClick={logout}>
                            Logout
                        </Button>
                    </>
                ) : (
                    <Button variant="outline-primary" onClick={onLogin}>
                        Admin Login
                    </Button>
                )}
            </div>
        </div>
    );
};

export default PageHeader;