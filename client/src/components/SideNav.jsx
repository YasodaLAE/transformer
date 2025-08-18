import React from 'react';
import { NavLink } from 'react-router-dom';
import './SideNav.css';

const SideNav = () => {
    return (
        <nav className="side-nav">
            <ul>
                <li>
                    <NavLink to="/" end>Dashboard</NavLink>
                </li>
                <li>
                    <NavLink to="/transformers">Transformers</NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default SideNav;