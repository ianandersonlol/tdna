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
    
    // If query is empty or too short, return some default genes
    if (!query || query.length < 2) {
      const defaultGenes = await Gene.findAll({
        where: {
          gene_id: {
            [Op.iLike]: 'AT1G%'
          }
        },
        limit: 10
      });
      return res.json(defaultGenes);
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
        // Prioritize exact matches at the beginning
        [sequelize.literal(`CASE 
          WHEN gene_id ILIKE '${query}%' THEN 1 
          WHEN gene_id ILIKE '%${query}%' THEN 2
          ELSE 3 
        END`), 'ASC'],
        ['gene_id', 'ASC']
      ],
      limit: 15
    });

    res.json(genes);
  } catch (error) {
    console.error('Error searching genes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;