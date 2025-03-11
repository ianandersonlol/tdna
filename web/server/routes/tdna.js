const express = require('express');
const router = express.Router();
const { TDNALine, TDNAPosition, Gene } = require('../models');
const { Sequelize } = require('sequelize');

// Get T-DNA lines for a gene
router.get('/gene/:geneId', async (req, res) => {
  try {
    let { geneId } = req.params;
    console.log(`Searching for T-DNA lines for gene: ${geneId}`);
    
    // Normalize geneId to uppercase as in R implementation
    geneId = geneId.toUpperCase();
    
    // Check if gene exists
    const gene = await Gene.findByPk(geneId);
    if (!gene) {
      console.log(`Gene not found: ${geneId}`);
      return res.status(404).json({ message: 'Gene not found' });
    }
    
    console.log(`Gene found: ${gene.gene_id}, now searching for T-DNA lines`);
    
    // Special case for AT1G25320 to match R implementation
    if (geneId === 'AT1G25320') {
      console.log('Handling special case for AT1G25320');
      // Find T-DNA lines with case-insensitive search
      const caseInsensitiveLines = await TDNALine.findAll({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('target_gene')), 
          'at1g25320'
        ),
        include: [
          {
            model: TDNAPosition,
            attributes: ['position_id', 'chromosome', 'position']
          }
        ]
      });
      
      console.log(`Found ${caseInsensitiveLines.length} T-DNA lines for AT1G25320 with case-insensitive search`);
      
      // If we still have no results, add the hardcoded values (which should have been imported)
      if (caseInsensitiveLines.length === 0) {
        console.log('No T-DNA lines found for AT1G25320, suggesting to run import-at1g25320 script');
        return res.status(200).json([]);
      }
      
      return res.json(caseInsensitiveLines);
    }
    
    // Find T-DNA lines for the gene
    const tdnaLines = await TDNALine.findAll({
      where: { target_gene: geneId },
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        }
      ]
    });
    
    console.log(`Found ${tdnaLines.length} T-DNA lines for gene: ${geneId}`);
    
    // If no lines found, try a case-insensitive search
    if (tdnaLines.length === 0) {
      console.log(`Trying case-insensitive search for T-DNA lines`);
      const altTdnaLines = await TDNALine.findAll({
        where: Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('target_gene')), 
          geneId.toLowerCase()
        ),
        include: [
          {
            model: TDNAPosition,
            attributes: ['position_id', 'chromosome', 'position']
          }
        ]
      });
      
      console.log(`Case-insensitive search found ${altTdnaLines.length} T-DNA lines`);
      if (altTdnaLines.length > 0) {
        return res.json(altTdnaLines);
      }
    }
    
    res.json(tdnaLines);
  } catch (error) {
    console.error('Error fetching T-DNA lines:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get details for a specific T-DNA line
router.get('/line/:lineId', async (req, res) => {
  try {
    const { lineId } = req.params;
    
    const tdnaLine = await TDNALine.findByPk(lineId, {
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        },
        {
          model: Gene,
          attributes: ['gene_id', 'chromosome', 'start_position', 'end_position', 'strand', 'description']
        }
      ]
    });
    
    if (!tdnaLine) {
      return res.status(404).json({ message: 'T-DNA line not found' });
    }
    
    res.json(tdnaLine);
  } catch (error) {
    console.error('Error fetching T-DNA line details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check TDNA data
router.get('/debug/counts', async (req, res) => {
  try {
    const lineCount = await TDNALine.count();
    const positionCount = await TDNAPosition.count();
    
    // Get a sample of TDNA lines
    const sampleLines = await TDNALine.findAll({
      limit: 5,
      order: [['line_id', 'ASC']]
    });
    
    // Count TDNA lines by first few genes
    const countsByGene = {};
    for (const line of sampleLines) {
      const geneId = line.target_gene;
      const count = await TDNALine.count({
        where: { target_gene: geneId }
      });
      countsByGene[geneId] = count;
    }
    
    // Check specific gene
    const at1g25320Count = await TDNALine.count({
      where: { target_gene: 'AT1G25320' }
    });
    
    const at1g25320LowerCount = await TDNALine.count({
      where: { target_gene: 'at1g25320' }
    });
    
    // Get all variations of gene ID casing
    const allVariants = await TDNALine.findAll({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('target_gene')), 
        'at1g25320'
      )
    });
    
    res.json({
      lines: lineCount,
      positions: positionCount,
      database: "connected",
      status: "ok",
      sampleLines: sampleLines.map(l => l.line_id),
      countsByGene,
      at1g25320: {
        uppercase: at1g25320Count,
        lowercase: at1g25320LowerCount,
        variants: allVariants.map(v => v.target_gene)
      }
    });
  } catch (error) {
    console.error('Error getting TDNA counts:', error);
    res.status(500).json({ 
      message: 'Database error',
      error: error.message
    });
  }
});

// Special debugging route for AT1G25320
router.get('/debug/at1g25320', async (req, res) => {
  try {
    // Find gene
    const gene = await Gene.findByPk('AT1G25320');
    
    // Check if gene exists
    if (!gene) {
      return res.json({
        status: 'error',
        message: 'Gene AT1G25320 not found in database'
      });
    }
    
    // Check for T-DNA lines with uppercase
    const upperLines = await TDNALine.findAll({
      where: { target_gene: 'AT1G25320' },
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        }
      ]
    });
    
    // Check for T-DNA lines with lowercase
    const lowerLines = await TDNALine.findAll({
      where: { target_gene: 'at1g25320' },
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        }
      ]
    });
    
    // Check for lines with case-insensitive search
    const caseInsensitiveLines = await TDNALine.findAll({
      where: Sequelize.where(
        Sequelize.fn('LOWER', Sequelize.col('target_gene')), 
        'at1g25320'
      ),
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        }
      ]
    });

    // Import direct T-DNA info based on R logic
    // This simulates the R function logic
    const simulatedRLogic = [
      {
        line_id: "SALK_019496",
        target_gene: "AT1G25320",
        hit_region: "Exon",
        homozygosity_status: "HMc",
        stock_center_status: "Sent",
        TDNAPositions: [
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
        TDNAPositions: [
          {
            chromosome: "Chr1",
            position: 8864989
          }
        ]
      }
    ];
    
    res.json({
      gene: gene,
      upperLines: upperLines,
      lowerLines: lowerLines,
      caseInsensitiveLines: caseInsensitiveLines,
      simulatedRLogic: simulatedRLogic,
      recommendation: "Add missing data from the R package using data import script"
    });
  } catch (error) {
    console.error('Error in AT1G25320 debug:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;