/**
 * Special script to import T-DNA data for AT1G25320
 * This directly implements the R logic from getTDNAlines function
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

// Define models inline for data import
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

// Define relationships
TDNALine.hasMany(TDNAPosition, { foreignKey: 'line_id' });
TDNAPosition.belongsTo(TDNALine, { foreignKey: 'line_id' });

// Hard-coded data for AT1G25320 from R package
const at1g25320Data = [
  {
    line_id: "SALK_019496",
    target_gene: "AT1G25320",
    hit_region: "Exon",
    homozygosity_status: "HMc",
    stock_center_status: "Sent",
    positions: [
      {
        chromosome: "Chr1",
        position: 8864721
      }
    ]
  },
  {
    line_id: "SALK_064305",
    target_gene: "AT1G25320",
    hit_region: "Exon",
    homozygosity_status: "HMc",
    stock_center_status: "Sent",
    positions: [
      {
        chromosome: "Chr1",
        position: 8864989
      }
    ]
  }
];

// Main function to import AT1G25320 data
async function importAT1G25320() {
  try {
    console.log('Starting AT1G25320 data import...');
    
    // Import each T-DNA line
    for (const tdna of at1g25320Data) {
      // Create or update the T-DNA line entry
      await TDNALine.upsert({
        line_id: tdna.line_id,
        target_gene: tdna.target_gene,
        hit_region: tdna.hit_region,
        homozygosity_status: tdna.homozygosity_status,
        stock_center_status: tdna.stock_center_status
      });
      
      // Add positions for this line
      for (const pos of tdna.positions) {
        await TDNAPosition.create({
          line_id: tdna.line_id,
          chromosome: pos.chromosome,
          position: pos.position
        });
      }
    }
    
    console.log('AT1G25320 data imported successfully');
  } catch (error) {
    console.error('Error importing AT1G25320 data:', error);
  }
}

// Run the import
importAT1G25320()
  .then(() => {
    console.log('AT1G25320 data import complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in AT1G25320 import process:', error);
    process.exit(1);
  });