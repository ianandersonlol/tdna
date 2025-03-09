const express = require('express');
const router = express.Router();
const { Gene, GeneFeature, TDNALine, TDNAPosition } = require('../models');
const { Op } = require('sequelize');

// Get visualization data for a gene
router.get('/:geneId', async (req, res) => {
  try {
    const { geneId } = req.params;

    // Get gene data
    const gene = await Gene.findByPk(geneId);
    if (!gene) {
      return res.status(404).json({ message: 'Gene not found' });
    }

    // Get gene features
    const features = await GeneFeature.findAll({
      where: { gene_id: geneId },
      attributes: ['feature_id', 'type', 'start_position', 'end_position', 'strand']
    });

    // Get T-DNA lines with their positions
    const tdnaLines = await TDNALine.findAll({
      where: { target_gene: geneId },
      include: [
        {
          model: TDNAPosition,
          attributes: ['position_id', 'chromosome', 'position']
        }
      ]
    });

    // Prepare visualization data
    const visualizationData = {
      gene: {
        id: gene.gene_id,
        chromosome: gene.chromosome,
        start: gene.start_position,
        end: gene.end_position,
        strand: gene.strand,
        description: gene.description
      },
      features: features.map(feature => ({
        id: feature.feature_id,
        type: feature.type,
        start: feature.start_position,
        end: feature.end_position,
        strand: feature.strand
      })),
      tdnaInsertions: tdnaLines.flatMap(line => 
        line.TDNAPositions.map(pos => ({
          line_id: line.line_id,
          chromosome: pos.chromosome,
          position: pos.position,
          hit_region: line.hit_region,
          homozygosity_status: line.homozygosity_status
        }))
      )
    };

    res.json(visualizationData);
  } catch (error) {
    console.error('Error generating visualization data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;