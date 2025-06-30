const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const messageRoutes = require('./routes/messages');
const connectionCache = require('./utils/connectioncache');
const { authenticateSocket } = require('./middleware/authenticate');
const setupSocket = require('./socket');

// Load environment variables with explicit path
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Environment variables loaded from:', envPath);
} else {
  console.warn('Warning: .env file not found at', envPath);
  dotenv.config(); // Fallback to default .env loading
}

// Set default environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || '5000';
process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastconnect';

// Log environment variables for debugging
console.log('Environment:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- CLIENT_URL:', process.env.CLIENT_URL);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'Not set');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'Not set');

// Initialize Express app
const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Create HTTP server
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174'
];

// Apply unified CORS middleware for Express
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Initialize Socket.IO with the same CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  },
  path: '/socket.io/',
  serveClient: false,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Add connection event logging
io.engine.on("connection_error", (err) => {
  console.log("Connection error:", err.req);      // the request object
  console.log("Error message:", err.code);     // the error code, for example 1
  console.log("Error message:", err.message);  // the error message, for example "Session ID unknown"
  console.log("Error context:", err.context);  // some additional error context
});

// Set up connection cache on the app instance
app.set('connectionCache', connectionCache);

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Add io to request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes with error handling
const loadRoute = (path, router) => {
  try {
    app.use(path, router);
    console.log(`Route loaded: ${path}`);
  } catch (error) {
    console.error(`Failed to load route ${path}:`, error);
    process.exit(1);
  }
};

// Load routes with error handling
loadRoute('/api/auth', authRoutes);
loadRoute('/api/profile', profileRoutes);
loadRoute('/api/messages', messageRoutes);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Test route
app.get("/", (req, res) => {
  res.send("FASTConnect backend running...");
});

// Setup Socket.IO
setupSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));