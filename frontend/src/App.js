import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from 'react-router-dom';
import axios from 'axios';
import './App.css';

const apiBaseUrl = 'http://localhost:5000/api'; // Adjust if needed

// SignUp Component
const SignUp = ({ setUsername, setPassword, handleRegister, errorMessage }) => (
  <div className="form-container">
    <h2>Sign Up</h2>
    <input
      type="text"
      onChange={(e) => setUsername(e.target.value)}
      placeholder="Username"
    />
    <input
      type="password"
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Password"
    />
    <button onClick={handleRegister}>Register</button>
    {errorMessage && <p className="error">{errorMessage}</p>}
    <p>
      Already have an account? <Link to="/login">Login here</Link>
    </p>
  </div>
);

// Login Component
const Login = ({ setUsername, setPassword, handleLogin, errorMessage }) => (
  <div className="form-container">
    <h2>Login</h2>
    <input
      type="text"
      onChange={(e) => setUsername(e.target.value)}
      placeholder="Username"
    />
    <input
      type="password"
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Password"
    />
    <button onClick={handleLogin}>Login</button>
    {errorMessage && <p className="error">{errorMessage}</p>}
    <p>
      Don't have an account? <Link to="/signup">Sign up here</Link>
    </p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ jwtToken }) => {
  if (!jwtToken) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h2>Protected Route</h2>
      <p>Congratulations! You have access to this protected route.</p>
    </div>
  );
};

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [jwtToken, setJwtToken] = useState('');

  // Handle Registration (Sign Up)
  const handleRegister = async () => {
    setErrorMessage('');
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/register`, {
        username,
        password,
      });
      alert('Registration successful! Token: ' + response.data.token);
      setJwtToken(response.data.token); // Save the JWT token
      setUsername('');
      setPassword('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Registration failed.');
    }
  };

  // Handle Login
  const handleLogin = async () => {
    setErrorMessage('');
    try {
      const response = await axios.post(`${apiBaseUrl}/auth/login`, {
        username,
        password,
      });
      alert('Login successful! Token: ' + response.data.token);
      setJwtToken(response.data.token); // Save the JWT token
      setUsername('');
      setPassword('');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Login failed.');
    }
  };

  return (
    <Router>
      <div className="App">
        <h1>User Authentication</h1>
        <nav>
          <Link to="/login">Login</Link> | <Link to="/signup">Sign Up</Link> |{' '}
          {jwtToken && <Link to="/protected">Protected Route</Link>}
        </nav>

        <Routes>
          {/* SignUp Route */}
          <Route
            path="/signup"
            element={
              <SignUp
                setUsername={setUsername}
                setPassword={setPassword}
                handleRegister={handleRegister}
                errorMessage={errorMessage}
              />
            }
          />

          {/* Login Route */}
          <Route
            path="/login"
            element={
              <Login
                setUsername={setUsername}
                setPassword={setPassword}
                handleLogin={handleLogin}
                errorMessage={errorMessage}
              />
            }
          />

          {/* Protected Route */}
          <Route
            path="/protected"
            element={<ProtectedRoute jwtToken={jwtToken} />}
          />

          {/* Default Route (Redirect to Login if no route matches) */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
