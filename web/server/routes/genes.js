const express = require('express');
const router = express.Router();
const { Gene, GeneFeature } = require('../models');
const sequelize = require('../config/database');
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
    console.log(`Searching for genes with query: ${query}`);
    
    // If query is empty or too short, return some default genes
    if (!query || query.length < 2) {
      console.log('Query too short, returning default genes');
      const defaultGenes = await Gene.findAll({
        where: {
          gene_id: {
            [Op.iLike]: 'AT1G%'
          }
        },
        limit: 10
      });
      console.log(`Found ${defaultGenes.length} default genes`);
      return res.json(defaultGenes);
    }
    
    // First try exact match
    if (query.match(/^AT[1-5]G\d+$/i)) {
      console.log(`Attempting exact match for gene_id: ${query}`);
      const exactMatch = await Gene.findOne({
        where: {
          gene_id: {
            [Op.iLike]: query
          }
        }
      });
      
      if (exactMatch) {
        console.log(`Found exact match for ${query}`);
        return res.json([exactMatch]);
      }
    }
    
    // Search by gene_id or description
    const genes = await Gene.findAll({
      where: {
        [Op.or]: [
          {
            gene_id: {
              [Op.iLike]: `%${query}%`
            }
          },
          {
            description: {
              [Op.iLike]: `%${query}%`
            }
          }
        ]
      },
      order: [
        ['gene_id', 'ASC']
      ],
      limit: 15
    });

    console.log(`Found ${genes.length} genes matching query: ${query}`);
    res.json(genes);
  } catch (error) {
    console.error('Error searching genes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Debug endpoint to check database status
router.get('/debug/counts', async (req, res) => {
  try {
    const geneCount = await Gene.count();
    const featureCount = await GeneFeature.count();
    
    res.json({
      genes: geneCount,
      features: featureCount,
      database: "connected",
      status: "ok"
    });
  } catch (error) {
    console.error('Error getting database counts:', error);
    res.status(500).json({ 
      message: 'Database error',
      error: error.message
    });
  }
});

module.exports = router;