// Entry point for the backend server
// This file wires up Express, MongoDB (via Mongoose), and Socket.io.

require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const documentRoutes = require('./routes/documents');
const { registerSocketHandlers } = require('./sockets');

const app = express();
const server = http.createServer(app);

// Allow the React dev server to talk to this API + Socket.io server
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

// Basic middlewares
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

// REST API routes for documents
app.use('/api/documents', documentRoutes);

// Health check endpoint (useful for debugging)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Register all Socket.io events / rooms logic
registerSocketHandlers(io);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/realtime-doc-editor';

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`✅ Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB', err);
    process.exit(1);
  });

