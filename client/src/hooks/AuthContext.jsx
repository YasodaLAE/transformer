import React, { createContext, useState, useContext } from 'react';

// Create a context object
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // State to hold user info
    const [user, setUser] = useState(null); // Will store user object
    const [isAdmin, setIsAdmin] = useState(false); // Flag for admin status

    // Function to handle login with a basic check
    const login = (username, password) => {
        if (username === 'admin' && password === 'admin') {
            setUser({ username: 'admin' });
            setIsAdmin(true);
            return true; // Login successful
        }
        return false; // Login failed
    };

    // Function to handle logout
    const logout = () => {
        setUser(null);
        setIsAdmin(false);
    };

    // The value provided to components that use this context
    const value = { user, isAdmin, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily access the context
export const useAuth = () => {
    return useContext(AuthContext);
};