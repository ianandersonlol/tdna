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
const sequelize = require('./config/database');

// Import models
const { Gene, TDNALine } = require('./models');

// Check database on startup
(async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Check if genes table has data
    const geneCount = await Gene.count();
    console.log(`Found ${geneCount} genes in database`);
    
    // Check if T-DNA lines table has data
    const tdnaCount = await TDNALine.count();
    console.log(`Found ${tdnaCount} T-DNA lines in database`);
    
    // If genes table is empty but T-DNA table has data, something is wrong
    if (geneCount === 0 && tdnaCount > 0) {
      console.warn('WARNING: No genes found but T-DNA lines exist. Database may be partially populated.');
      console.warn('Run "npm run import-sample-genes" to import sample gene data.');
    } else if (geneCount === 0) {
      console.warn('WARNING: No genes found in database. Run "npm run import-data" to import data.');
    }
    
    // Check for specific genes
    const at1g25320 = await Gene.findByPk('AT1G25320');
    console.log(`AT1G25320 exists in database: ${at1g25320 !== null}`);
    
    if (!at1g25320) {
      console.warn('WARNING: AT1G25320 not found in database. Run "npm run import-sample-genes" to fix.');
    }
  } catch (error) {
    console.error('Error checking database on startup:', error);
  }
})();

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