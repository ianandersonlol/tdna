const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Import routes
const geneRoutes = require('./routes/genes');
const tdnaRoutes = require('./routes/tdna');
const visualizeRoutes = require('./routes/visualize');

// Initialize dotenv
dotenv.config();

// Database connection
require('./config/database');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/genes', geneRoutes);
app.use('/api/tdna', tdnaRoutes);
app.use('/api/visualize', visualizeRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'T-DNA Insertion Web API' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});