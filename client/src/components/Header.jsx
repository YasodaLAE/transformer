import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ rightContent }) => {
    return (
        <header className="app-header">
            <Link to="/" className="logo">Oversight</Link>
            <div className="user-info">
                {rightContent}
            </div>
        </header>
    );
};

export default Header;