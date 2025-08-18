import React from 'react';
import Header from './Header';
import SideNav from './SideNav';
import './Layout.css';

const Layout = ({ children }) => {
    return (
        <div className="app-layout">
            <Header />
            <div className="main-container">
                <SideNav />
                <main className="content-area">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;