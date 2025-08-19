import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../hooks/AuthContext'; // Import the useAuth hook

const Login = ({ onLoginSuccess }) => {
    // State to manage both username and password inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const { login } = useAuth(); // Get the login function from the AuthContext

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);

        // Call the login function from AuthContext with both username and password
        const success = login(username, password);

        if (success) {
            onLoginSuccess(); // This will close the modal and update the UI
        } else {
            setError('Invalid username or password.');
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}

            <Form.Group className="mb-3" controlId="formUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
            </Form.Group>

            <Button variant="primary" type="submit">
                Login
            </Button>
        </Form>
    );
};

export default Login;