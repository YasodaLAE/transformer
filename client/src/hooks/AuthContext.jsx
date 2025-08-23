import React, { createContext, useState, useContext } from 'react';

// Create a context object
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // State to hold user info
    const [user, setUser] = useState(null); // Will store user object
    const [isAdmin, setIsAdmin] = useState(false); // Flag for admin status

    // Define a list of valid admin credentials
    const adminCredentials = {
        'admin': '1',
        'admin2': '2', // Example new admin
        'admin3': '3'  // Another example new admin
    };

    // Function to handle login with a basic check against the adminCredentials list
    const login = (username, password) => {
        // Check if the provided username exists in the adminCredentials list
        // AND if the provided password matches the stored password for that username.
        if (adminCredentials[username] === password) {
            setUser({ username: username });
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