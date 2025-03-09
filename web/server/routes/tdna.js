const express = require('express');
const router = express.Router();
const { TDNALine, TDNAPosition, Gene } = require('../models');

// Get T-DNA lines for a gene
router.get('/gene/:geneId', async (req, res) => {
  try {
    const { geneId } = req.params;
    console.log(`Searching for T-DNA lines for gene: ${geneId}`);
    
    // Check if gene exists
    const gene = await Gene.findByPk(geneId);
    if (!gene) {
      console.log(`Gene not found: ${geneId}`);
      return res.status(404).json({ message: 'Gene not found' });
    }
    
    console.log(`Gene found: ${gene.gene_id}, now searching for T-DNA lines`);
    
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
    
    // If no lines found, try an alternative search with lowercase
    if (tdnaLines.length === 0) {
      console.log(`Trying alternative search for T-DNA lines with lowercase gene_id`);
      const altTdnaLines = await TDNALine.findAll({
        where: { target_gene: geneId.toLowerCase() },
        include: [
          {
            model: TDNAPosition,
            attributes: ['position_id', 'chromosome', 'position']
          }
        ]
      });
      
      console.log(`Alternative search found ${altTdnaLines.length} T-DNA lines`);
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
    
    res.json({
      lines: lineCount,
      positions: positionCount,
      database: "connected",
      status: "ok",
      sampleLines: sampleLines.map(l => l.line_id),
      countsByGene
    });
  } catch (error) {
    console.error('Error getting TDNA counts:', error);
    res.status(500).json({ 
      message: 'Database error',
      error: error.message
    });
  }
});

module.exports = router;