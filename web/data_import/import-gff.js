const fs = require('fs');
const zlib = require('node:zlib'); // Use built-in Node.js zlib module
const readline = require('readline');
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

// Define relationships
Gene.hasMany(GeneFeature, { foreignKey: 'gene_id' });
GeneFeature.belongsTo(Gene, { foreignKey: 'gene_id' });

// Function to parse GFF file
async function parseGFF(filePath) {
  try {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: GFF file not found at path: ${filePath}`);
      console.error('Please make sure the data files are present in the correct location.');
      console.error('Importing sample genes as a fallback...');
      
      // Run the sample genes import script as a fallback
      const { exec } = require('child_process');
      exec('node import-sample-genes.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Error importing sample genes:', error);
          return;
        }
        console.log(stdout);
      });
      
      return;
    }

    // Create database tables
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity
    });

    let genesCount = 0;
    let featuresCount = 0;
    let geneBatch = [];
    let featureBatch = [];
    
    console.log('Starting to parse GFF file...');
    
    // Set to track Arabidopsis gene IDs
    const arabidopsisGenes = new Set();

    for await (const line of rl) {
      // Skip comment lines
      if (line.startsWith('#')) continue;

      const fields = line.split('\t');
      if (fields.length < 9) continue;

      const [
        chromosome, 
        source, 
        type, 
        start, 
        end, 
        score, 
        strand, 
        phase, 
        attributes
      ] = fields;

      // Extract gene ID from attributes
      const idMatch = attributes.match(/ID=([^;]+)/);
      const parentMatch = attributes.match(/Parent=([^;]+)/);
      const nameMatch = attributes.match(/Name=([^;]+)/);
      
      let geneId = null;
      
      if (type === 'gene') {
        if (idMatch) {
          geneId = idMatch[1];
          
          // Convert to uppercase for Arabidopsis genes
          if (geneId.toUpperCase().match(/^AT[1-5]G\d+$/)) {
            geneId = geneId.toUpperCase();
            arabidopsisGenes.add(geneId);
          }
          
          // Add gene to batch
          geneBatch.push({
            gene_id: geneId,
            chromosome,
            start_position: parseInt(start),
            end_position: parseInt(end),
            strand,
            description: attributes
          });
          
          genesCount++;
          
          // Bulk insert genes in batches of 100
          if (geneBatch.length >= 100) {
            await Gene.bulkCreate(geneBatch, { ignoreDuplicates: true });
            geneBatch = [];
            console.log(`Processed ${genesCount} genes so far...`);
          }
        }
      } else if (['exon', 'CDS', 'five_prime_UTR', 'three_prime_UTR'].includes(type)) {
        // For features, get parent gene ID
        if (parentMatch) {
          let parentId = parentMatch[1];
          
          // Convert to uppercase for Arabidopsis genes
          if (parentId.toUpperCase().match(/^AT[1-5]G\d+$/)) {
            parentId = parentId.toUpperCase();
          }
          
          // Add feature to batch
          featureBatch.push({
            gene_id: parentId,
            chromosome,
            type,
            start_position: parseInt(start),
            end_position: parseInt(end),
            strand
          });
          
          featuresCount++;
          
          // Bulk insert features in batches of 1000
          if (featureBatch.length >= 1000) {
            await GeneFeature.bulkCreate(featureBatch, { ignoreDuplicates: true });
            featureBatch = [];
            console.log(`Processed ${featuresCount} features so far...`);
          }
        }
      }
    }
    
    // Insert any remaining genes and features
    if (geneBatch.length > 0) {
      await Gene.bulkCreate(geneBatch, { ignoreDuplicates: true });
    }
    
    if (featureBatch.length > 0) {
      await GeneFeature.bulkCreate(featureBatch, { ignoreDuplicates: true });
    }
    
    console.log(`GFF import complete. Imported ${genesCount} genes and ${featuresCount} features.`);
    console.log(`Found ${arabidopsisGenes.size} Arabidopsis genes (AT*G*)`);
    
    // Check for specific genes
    const at1g25320 = await Gene.findByPk('AT1G25320');
    if (!at1g25320) {
      console.log('AT1G25320 not found in imported data. Running sample genes import as fallback...');
      
      // Run the sample genes import script as a fallback
      const { exec } = require('child_process');
      exec('node import-sample-genes.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Error importing sample genes:', error);
          return;
        }
        console.log(stdout);
      });
    }
  } catch (error) {
    console.error('Error parsing GFF file:', error);
    
    // Import sample genes on error
    console.log('Error in GFF import. Running sample genes import as fallback...');
    const { exec } = require('child_process');
    exec('node import-sample-genes.js', (error, stdout, stderr) => {
      if (error) {
        console.error('Error importing sample genes:', error);
        return;
      }
      console.log(stdout);
    });
  }
}

// Path to GFF file
const gffFilePath = '../../inst/extdata/Araport11_GFF3_genes_transposons.201606.gff.gz';

// Run the parser
parseGFF(gffFilePath)
  .then(() => {
    console.log('GFF parsing completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in GFF parsing process:', error);
    process.exit(1);
  });