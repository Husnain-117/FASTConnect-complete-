const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const multer = require('multer');
const connectionCache = require('./utils/connectioncache');
const { authenticateSocket } = require('./middleware/authenticate');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 10000, // Increase ping timeout to 10 seconds
  pingInterval: 25000  // Send a ping every 25 seconds
});

// Set up connection cache on the app instance
app.set('connectionCache', connectionCache);

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/uploads', express.static('uploads'));

// Test route
app.get("/", (req, res) => {
  res.send("FASTConnect backend running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));