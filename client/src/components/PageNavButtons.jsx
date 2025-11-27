import React from 'react';
import { Link, useLocation } from 'react-router-dom'; // Import useLocation
import './PageNavButtons.css';

const PageNavButtons = () => {
    const location = useLocation();
    const activeTab = location.pathname.includes('/inspections') ? 'inspections' : 'transformers';

    return (
        <div className="page-nav-buttons">
            <Link
                to="/transformers"
                className={`nav-button ${activeTab === 'transformers' ? 'active' : ''}`}
            >
                Transformers
            </Link>
            <Link
                to="/inspections"
                className={`nav-button ${activeTab === 'inspections' ? 'active' : ''}`}
            >
                Inspections
            </Link>
        </div>
    );
};

export default PageNavButtons;