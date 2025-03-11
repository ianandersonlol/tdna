/**
 * Script to check and debug database contents
 */

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config({ path: '../server/.env' });

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

// Define models inline
const Gene = sequelize.define('Gene', {
  gene_id: {
    type: DataTypes.STRING(20),
    primaryKey: true
  },
  chromosome: DataTypes.STRING(10),
  start_position: DataTypes.INTEGER,
  end_position: DataTypes.INTEGER,
  strand: DataTypes.CHAR(1),
  description: DataTypes.TEXT
}, {
  tableName: 'genes',
  timestamps: false
});

const GeneFeature = sequelize.define('GeneFeature', {
  feature_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  gene_id: DataTypes.STRING(20),
  chromosome: DataTypes.STRING(10),
  type: DataTypes.STRING(50),
  start_position: DataTypes.INTEGER,
  end_position: DataTypes.INTEGER,
  strand: DataTypes.CHAR(1)
}, {
  tableName: 'gene_features',
  timestamps: false
});

const TDNALine = sequelize.define('TDNALine', {
  line_id: {
    type: DataTypes.STRING(50),
    primaryKey: true
  },
  target_gene: DataTypes.STRING(20),
  hit_region: DataTypes.STRING(20),
  homozygosity_status: DataTypes.STRING(10),
  stock_center_status: DataTypes.STRING(20)
}, {
  tableName: 'tdna_lines',
  timestamps: false
});

const TDNAPosition = sequelize.define('TDNAPosition', {
  position_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  line_id: DataTypes.STRING(50),
  chromosome: DataTypes.STRING(10),
  position: DataTypes.INTEGER
}, {
  tableName: 'tdna_positions',
  timestamps: false
});

// Function to check database
async function checkDatabase() {
  try {
    console.log('Checking database connection...');
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Check genes table
    const geneCount = await Gene.count();
    console.log(`Gene count: ${geneCount}`);
    
    if (geneCount > 0) {
      // Get some sample genes
      const sampleGenes = await Gene.findAll({ limit: 5 });
      console.log('Sample genes:');
      sampleGenes.forEach(gene => {
        console.log(`- ${gene.gene_id} (${gene.chromosome}:${gene.start_position}-${gene.end_position})`);
      });
      
      // Check if AT1G25320 exists
      const specificGene = await Gene.findByPk('AT1G25320');
      console.log(`AT1G25320 exists: ${specificGene !== null}`);
      
      // Try case-insensitive search
      const lowerCaseGene = await Gene.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('gene_id')), 
          'at1g25320'
        )
      });
      console.log(`AT1G25320 (case-insensitive) exists: ${lowerCaseGene !== null}`);
    } else {
      console.log('WARNING: No genes found in the database. Data import may have failed.');
    }
    
    // Check T-DNA lines table
    const tdnaCount = await TDNALine.count();
    console.log(`T-DNA line count: ${tdnaCount}`);
    
    if (tdnaCount > 0) {
      // Get some sample T-DNA lines
      const sampleLines = await TDNALine.findAll({ limit: 5 });
      console.log('Sample T-DNA lines:');
      sampleLines.forEach(line => {
        console.log(`- ${line.line_id} (Target: ${line.target_gene})`);
      });
      
      // Check T-DNA lines for AT1G25320
      const specificLines = await TDNALine.findAll({
        where: { target_gene: 'AT1G25320' }
      });
      console.log(`T-DNA lines for AT1G25320: ${specificLines.length}`);
      
      if (specificLines.length > 0) {
        console.log('Sample lines for AT1G25320:');
        specificLines.slice(0, 3).forEach(line => {
          console.log(`- ${line.line_id}`);
        });
      }
    } else {
      console.log('WARNING: No T-DNA lines found in the database. Data import may have failed.');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

// Run the check
checkDatabase()
  .then(() => {
    console.log('Database check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in database check process:', error);
    process.exit(1);
  });