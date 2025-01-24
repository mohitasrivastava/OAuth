const express = require('express');
const cluster = require('cluster');
const os = require('os');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors({ origin: 'http://localhost:3000' }));

// In-memory user storage (for demo purposes)
const users = [];

// Helper functions for JWT generation and verification
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to protect routes
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.user = decoded; // Add decoded user info to the request object
  next();
};

// Routes

// User registration route
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  const existingUser = users.find((user) => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, password: hashedPassword };
  users.push(newUser);

  const token = generateToken(newUser);
  res.json({ message: 'User registered successfully', token });
});

// User login route
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  const user = users.find((user) => user.username === username);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ message: 'Login successful', token });
});

// Protected route (only accessible to authenticated users)
app.get('/api/protected', authenticate, (req, res) => {
  res.json({
    message: `Hello ${req.user.username}, you have access to this protected route`,
  });
});

// Node clustering to take advantage of multiple cores
if (cluster.isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`Master process running on PID: ${process.pid}`);

  // Fork workers for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
  });
} else {
  // Start the server in each worker
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}, Worker PID: ${process.pid}`);
  });
}
