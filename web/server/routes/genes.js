const express = require('express');
const router = express.Router();
const { Gene, GeneFeature } = require('../models');
const { Op } = require('sequelize');

// Get a gene by ID
router.get('/:geneId', async (req, res) => {
  try {
    const { geneId } = req.params;
    const gene = await Gene.findByPk(geneId, {
      include: [
        {
          model: GeneFeature,
          attributes: ['feature_id', 'type', 'start_position', 'end_position', 'strand']
        }
      ]
    });

    if (!gene) {
      return res.status(404).json({ message: 'Gene not found' });
    }

    res.json(gene);
  } catch (error) {
    console.error('Error fetching gene:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search genes
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const genes = await Gene.findAll({
      where: {
        gene_id: {
          [Op.iLike]: `%${query}%`
        }
      },
      limit: 10
    });

    res.json(genes);
  } catch (error) {
    console.error('Error searching genes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;