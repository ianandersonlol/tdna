const express = require('express');
const router = express.Router();
const { TDNALine, TDNAPosition, Gene } = require('../models');

// Get T-DNA lines for a gene
router.get('/gene/:geneId', async (req, res) => {
  try {
    const { geneId } = req.params;
    
    // Check if gene exists
    const gene = await Gene.findByPk(geneId);
    if (!gene) {
      return res.status(404).json({ message: 'Gene not found' });
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

module.exports = router;