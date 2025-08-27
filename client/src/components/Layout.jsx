import React, { useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import './Layout.css';
import { useAuth } from '../hooks/AuthContext';
import { Modal, Button } from 'react-bootstrap';
import Login from './Login'; 

const Layout = ({ children }) => {
    const [showLoginModal, setShowLoginModal] = useState(false);
    const { isAdmin, logout, user } = useAuth();

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
    };

    return (
        <div className="app-layout">
            <Header
                rightContent={
                    isAdmin ? (
                        <div className="d-flex align-items-center gap-2">
                            {user && <span className="me-2 text-black">Welcome, {user.username}</span>}
                            <Button className="btn btn-secondary" onClick={logout}>Logout</Button>
                        </div>
                    ) : (
                        <Button variant="outline-primary" onClick={() => setShowLoginModal(true)}>Admin Login</Button>
                    )
                }
            />
            <div className="main-container">
                <SideNav />
                <main className="content-area">
                    {children}
                </main>
            </div>

            <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)}>
                <Modal.Header closeButton><Modal.Title>Admin Login</Modal.Title></Modal.Header>
                <Modal.Body><Login onLoginSuccess={handleLoginSuccess} /></Modal.Body>
            </Modal>
        </div>
    );
};

export default Layout;
