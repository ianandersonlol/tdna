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

// Function to parse confirmed T-DNA lines
async function parseConfirmedTDNA(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity
    });

    let lineCount = 0;
    let batch = [];
    
    console.log('Starting to parse confirmed T-DNA lines...');

    let isHeader = true;

    for await (const line of rl) {
      // Skip header
      if (isHeader) {
        isHeader = false;
        continue;
      }

      const fields = line.split('\t');
      if (fields.length < 5) continue;

      // Extract fields and trim whitespace
      const [
        targetGene,
        lineId,
        hitRegion,
        homozygosity,
        stockCenter
      ] = fields.map(field => field.trim());
      
      // Filter based on R code logic:
      // confirmed__exon_hom_sent <- confirmed[`Hit region`=="Exon" & HM %in% c("HMc","HMn") & ABRC != "NotSent"]
      if (
        hitRegion === "Exon" && 
        (homozygosity === "HMc" || homozygosity === "HMn") && 
        stockCenter !== "NotSent"
      ) {
        // Convert gene ID to uppercase like in R: `Target Gene` <- toupper(`Target Gene`)
        const normalizedGeneId = targetGene.toUpperCase();
        
        // Add line to batch
        batch.push({
          line_id: lineId,
          target_gene: normalizedGeneId,
          hit_region: hitRegion,
          homozygosity_status: homozygosity,
          stock_center_status: stockCenter
        });
        
        lineCount++;
        
        // Bulk insert in batches of 100
        if (batch.length >= 100) {
          await TDNALine.bulkCreate(batch, { ignoreDuplicates: true });
          batch = [];
          console.log(`Processed ${lineCount} T-DNA lines so far...`);
        }
      }
    }
    
    // Insert any remaining lines
    if (batch.length > 0) {
      await TDNALine.bulkCreate(batch, { ignoreDuplicates: true });
    }
    
    console.log(`Confirmed T-DNA import complete. Imported ${lineCount} lines.`);
  } catch (error) {
    console.error('Error parsing confirmed T-DNA file:', error);
  }
}

// Function to parse T-DNA positions
async function parseTDNAPositions(filePath) {
  try {
    const fileStream = fs.createReadStream(filePath);
    const gunzip = zlib.createGunzip();
    const rl = readline.createInterface({
      input: fileStream.pipe(gunzip),
      crlfDelay: Infinity
    });

    let positionCount = 0;
    let batch = [];
    
    console.log('Starting to parse T-DNA positions...');
    
    // Get all T-DNA lines that we have imported
    const tdnaLines = await TDNALine.findAll({
      attributes: ['line_id']
    });
    const lineIds = new Set(tdnaLines.map(line => line.line_id));
    
    console.log(`Found ${lineIds.size} T-DNA lines to match positions against`);

    for await (const line of rl) {
      const fields = line.split('\t');
      if (fields.length < 5) continue;

      const lineId = fields[0].trim();
      
      // Only process lines that we have imported before
      if (lineIds.has(lineId)) {
        // Extract position info from the raw data
        const positionInfo = fields[4].trim();
        
        // Parse position based on R code logic:
        // location$pos <- as.numeric(sapply(location$V5, function(x) unlist(strsplit(unlist(strsplit(as.character(x), " vs "))[1], "-"))[1]))
        const match = positionInfo.split(' vs ')[0];
        let position = parseInt(match.split('-')[0]);
        
        if (!isNaN(position)) {
          // Extract chromosome from another column or derive from gene ID
          // Assuming Chr1, Chr2, etc. format
          const chrMatch = fields[1]?.match(/Chr([0-9]+)/i) || ["", "1"];
          const chromosome = `Chr${chrMatch[1]}`;
          
          // Add position to batch
          batch.push({
            line_id: lineId,
            chromosome: chromosome,
            position: position
          });
          
          positionCount++;
          
          // Bulk insert in batches of 500
          if (batch.length >= 500) {
            await TDNAPosition.bulkCreate(batch, { ignoreDuplicates: true });
            batch = [];
            console.log(`Processed ${positionCount} positions so far...`);
          }
        }
      }
    }
    
    // Insert any remaining positions
    if (batch.length > 0) {
      await TDNAPosition.bulkCreate(batch, { ignoreDuplicates: true });
    }
    
    console.log(`T-DNA positions import complete. Imported ${positionCount} positions.`);
  } catch (error) {
    console.error('Error parsing T-DNA positions file:', error);
  }
}

// Main function to import all T-DNA data
async function importTDNAData() {
  try {
    // Create tables
    await sequelize.sync({ force: true });
    console.log('Database tables created');
    
    // First import confirmed T-DNA lines
    await parseConfirmedTDNA('../../inst/extdata/sum_SALK_confirmed.txt.gz');
    
    // Then import positions
    await parseTDNAPositions('../../inst/extdata/T-DNAall.Genes.Araport11.txt.gz');
    
    console.log('T-DNA data import complete');
  } catch (error) {
    console.error('Error in T-DNA data import:', error);
  }
}

// Run the import
importTDNAData()
  .then(() => {
    console.log('All T-DNA data imported successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in T-DNA data import process:', error);
    process.exit(1);
  });