import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
    return (
        <header className="app-header">
            <Link to="/" className="logo">Oversight</Link>
            <div className="user-info">
                <span>olivera@gmail.com</span>
            </div>
        </header>
    );
};

export default Header;