/**
 * Script to import sample genes and their T-DNA lines
 * This is used to ensure that some basic genes work even if the main
 * import fails.
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

// Define relationships
Gene.hasMany(GeneFeature, { foreignKey: 'gene_id' });
GeneFeature.belongsTo(Gene, { foreignKey: 'gene_id' });
TDNALine.hasMany(TDNAPosition, { foreignKey: 'line_id' });
TDNAPosition.belongsTo(TDNALine, { foreignKey: 'line_id' });

// Sample gene data to insert
const sampleGenes = [
  {
    gene_id: 'AT1G25320',
    chromosome: 'Chr1',
    start_position: 8863550,
    end_position: 8866320,
    strand: '+',
    description: 'Leucine-rich repeat (LRR) family protein'
  },
  {
    gene_id: 'AT3G15500',
    chromosome: 'Chr3',
    start_position: 5242700,
    end_position: 5246820,
    strand: '+',
    description: 'NAC domain containing protein 3'
  },
  {
    gene_id: 'AT5G20320',
    chromosome: 'Chr5',
    start_position: 6865400,
    end_position: 6868200,
    strand: '-',
    description: 'DCL4 (DICER-LIKE 4); ribonuclease III'
  }
];

// Sample gene features
const sampleFeatures = [
  // AT1G25320 features
  {
    gene_id: 'AT1G25320',
    chromosome: 'Chr1',
    type: 'exon',
    start_position: 8863550,
    end_position: 8866320,
    strand: '+'
  },
  {
    gene_id: 'AT1G25320',
    chromosome: 'Chr1',
    type: 'CDS',
    start_position: 8863750,
    end_position: 8866120,
    strand: '+'
  },
  // AT3G15500 features
  {
    gene_id: 'AT3G15500',
    chromosome: 'Chr3',
    type: 'exon',
    start_position: 5242700,
    end_position: 5246820,
    strand: '+'
  },
  {
    gene_id: 'AT3G15500',
    chromosome: 'Chr3',
    type: 'CDS',
    start_position: 5242900,
    end_position: 5246620,
    strand: '+'
  },
  // AT5G20320 features
  {
    gene_id: 'AT5G20320',
    chromosome: 'Chr5',
    type: 'exon',
    start_position: 6865400,
    end_position: 6868200,
    strand: '-'
  },
  {
    gene_id: 'AT5G20320',
    chromosome: 'Chr5',
    type: 'CDS',
    start_position: 6865600,
    end_position: 6868000,
    strand: '-'
  }
];

// Sample T-DNA lines
const sampleTDNALines = [
  // AT1G25320 T-DNA lines
  {
    line_id: 'SALK_019496',
    target_gene: 'AT1G25320',
    hit_region: 'Exon',
    homozygosity_status: 'HMc',
    stock_center_status: 'Sent',
    positions: [
      {
        chromosome: 'Chr1',
        position: 8864721
      }
    ]
  },
  {
    line_id: 'SALK_064305',
    target_gene: 'AT1G25320',
    hit_region: 'Exon',
    homozygosity_status: 'HMc',
    stock_center_status: 'Sent',
    positions: [
      {
        chromosome: 'Chr1',
        position: 8864989
      }
    ]
  },
  // AT3G15500 T-DNA lines
  {
    line_id: 'SALK_022022',
    target_gene: 'AT3G15500',
    hit_region: 'Exon',
    homozygosity_status: 'HMc',
    stock_center_status: 'Sent',
    positions: [
      {
        chromosome: 'Chr3',
        position: 5243850
      }
    ]
  },
  // AT5G20320 T-DNA lines
  {
    line_id: 'SALK_088566',
    target_gene: 'AT5G20320',
    hit_region: 'Exon',
    homozygosity_status: 'HMc',
    stock_center_status: 'Sent',
    positions: [
      {
        chromosome: 'Chr5',
        position: 6867200
      }
    ]
  }
];

// Function to import sample data
async function importSampleData() {
  try {
    console.log('Starting sample data import...');
    
    // Create or verify tables
    const tablesExist = await sequelize.getQueryInterface().showAllTables()
      .then(tables => {
        return tables.includes('genes') && 
               tables.includes('gene_features') && 
               tables.includes('tdna_lines') && 
               tables.includes('tdna_positions');
      });
      
    if (!tablesExist) {
      await sequelize.sync();
      console.log('Created database tables');
    }
    
    // Insert genes
    console.log('Importing sample genes...');
    for (const gene of sampleGenes) {
      await Gene.upsert(gene);
    }
    console.log(`Imported ${sampleGenes.length} sample genes`);
    
    // Insert gene features
    console.log('Importing sample gene features...');
    for (const feature of sampleFeatures) {
      await GeneFeature.upsert(feature);
    }
    console.log(`Imported ${sampleFeatures.length} sample gene features`);
    
    // Insert T-DNA lines and positions
    console.log('Importing sample T-DNA lines...');
    for (const tdnaLine of sampleTDNALines) {
      await TDNALine.upsert({
        line_id: tdnaLine.line_id,
        target_gene: tdnaLine.target_gene,
        hit_region: tdnaLine.hit_region,
        homozygosity_status: tdnaLine.homozygosity_status,
        stock_center_status: tdnaLine.stock_center_status
      });
      
      for (const position of tdnaLine.positions) {
        await TDNAPosition.upsert({
          line_id: tdnaLine.line_id,
          chromosome: position.chromosome,
          position: position.position
        });
      }
    }
    console.log(`Imported ${sampleTDNALines.length} sample T-DNA lines`);
    
    console.log('Sample data import completed successfully');
  } catch (error) {
    console.error('Error importing sample data:', error);
    throw error;
  }
}

// Run the import
importSampleData()
  .then(() => {
    console.log('Sample data import complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in sample data import process:', error);
    process.exit(1);
  });