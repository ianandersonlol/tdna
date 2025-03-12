const express = require('express');
const router = express.Router();
const { Gene, GeneFeature } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Get a gene by ID
router.get('/:geneId', async (req, res) => {
  try {
    const { geneId } = req.params;
    
    // Normalize geneId to uppercase for Arabidopsis genes
    const normalizedGeneId = geneId.match(/^at[1-5]g\d+$/i) ? geneId.toUpperCase() : geneId;
    
    // Try exact match first
    const gene = await Gene.findByPk(normalizedGeneId, {
      include: [
        {
          model: GeneFeature,
          attributes: ['feature_id', 'type', 'start_position', 'end_position', 'strand']
        }
      ]
    });

    if (gene) {
      return res.json(gene);
    }
    
    // Try case-insensitive search
    const caseInsensitiveGene = await Gene.findOne({
      where: sequelize.where(
        sequelize.fn('LOWER', sequelize.col('gene_id')), 
        normalizedGeneId.toLowerCase()
      ),
      include: [
        {
          model: GeneFeature,
          attributes: ['feature_id', 'type', 'start_position', 'end_position', 'strand']
        }
      ]
    });
    
    if (caseInsensitiveGene) {
      console.log(`Found gene with case-insensitive search: ${caseInsensitiveGene.gene_id}`);
      return res.json(caseInsensitiveGene);
    }
    
    console.log(`Gene not found in database: ${normalizedGeneId}`);
    
    // Only use hardcoded data for these specific demo genes
    const demoGenes = ['AT1G25320', 'AT3G15500', 'AT5G20320'];
    
    if (demoGenes.includes(normalizedGeneId)) {
      console.log(`Using hardcoded data for demo gene: ${normalizedGeneId}`);
      
      // Hardcoded demo gene data
      const hardcodedGenes = {
        "AT1G25320": {
          gene_id: "AT1G25320",
          chromosome: "Chr1",
          start_position: 8863550,
          end_position: 8866320,
          strand: "+",
          description: "Leucine-rich repeat (LRR) family protein",
          GeneFeatures: [
            { feature_id: 10001, type: "exon", start_position: 8863550, end_position: 8866320, strand: "+" },
            { feature_id: 10002, type: "CDS", start_position: 8863750, end_position: 8866120, strand: "+" }
          ]
        },
        "AT3G15500": {
          gene_id: "AT3G15500",
          chromosome: "Chr3",
          start_position: 5242700,
          end_position: 5246820,
          strand: "+",
          description: "NAC domain containing protein 3",
          GeneFeatures: [
            { feature_id: 20001, type: "exon", start_position: 5242700, end_position: 5246820, strand: "+" },
            { feature_id: 20002, type: "CDS", start_position: 5242900, end_position: 5246620, strand: "+" }
          ]
        },
        "AT5G20320": {
          gene_id: "AT5G20320",
          chromosome: "Chr5",
          start_position: 6865400,
          end_position: 6868200,
          strand: "-",
          description: "DCL4 (DICER-LIKE 4); ribonuclease III",
          GeneFeatures: [
            { feature_id: 30001, type: "exon", start_position: 6865400, end_position: 6868200, strand: "-" },
            { feature_id: 30002, type: "CDS", start_position: 6865600, end_position: 6868000, strand: "-" }
          ]
        }
      };
      
      return res.json(hardcodedGenes[normalizedGeneId]);
    }
    
    // If gene is not in database and not a demo gene, return 404
    return res.status(404).json({ 
      message: 'Gene not found', 
      geneId: normalizedGeneId 
    });
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
    
    // If query is empty or too short, return some database genes
    if (!query || query.length < 2) {
      console.log('Query too short, returning default genes');
      
      // Try to get database genes first
      try {
        const defaultGenes = await Gene.findAll({
          where: {
            gene_id: {
              [Op.iLike]: 'AT1G%'
            }
          },
          limit: 10
        });
        
        if (defaultGenes && defaultGenes.length > 0) {
          console.log(`Found ${defaultGenes.length} default genes from database`);
          return res.json(defaultGenes);
        }
      } catch (dbError) {
        console.log('Error fetching default genes from database, using demo genes');
      }
      
      // Fallback to demo genes if database search fails or returns no results
      const demoGenes = [
        {
          gene_id: "AT1G25320",
          chromosome: "Chr1",
          start_position: 8863550,
          end_position: 8866320,
          strand: "+",
          description: "Leucine-rich repeat (LRR) family protein"
        },
        {
          gene_id: "AT3G15500",
          chromosome: "Chr3",
          start_position: 5242700,
          end_position: 5246820,
          strand: "+",
          description: "NAC domain containing protein 3"
        },
        {
          gene_id: "AT5G20320",
          chromosome: "Chr5",
          start_position: 6865400,
          end_position: 6868200,
          strand: "-",
          description: "DCL4 (DICER-LIKE 4); ribonuclease III"
        }
      ];
      
      console.log('Using demo genes');
      return res.json(demoGenes);
    }
    
    // Normalize Arabidopsis gene IDs to uppercase
    let normalizedQuery = query;
    if (query.match(/^at[1-5]g\d+$/i)) {
      normalizedQuery = query.toUpperCase();
    }
    
    // First try exact match for Arabidopsis gene IDs
    if (normalizedQuery.match(/^AT[1-5]G\d+$/)) {
      console.log(`Attempting exact match for gene_id: ${normalizedQuery}`);
      
      // Try exact match
      const exactMatch = await Gene.findOne({
        where: {
          gene_id: normalizedQuery
        }
      });
      
      if (exactMatch) {
        console.log(`Found exact match for ${normalizedQuery}`);
        return res.json([exactMatch]);
      }
      
      // Try case-insensitive match
      const caseInsensitiveMatch = await Gene.findOne({
        where: sequelize.where(
          sequelize.fn('LOWER', sequelize.col('gene_id')), 
          normalizedQuery.toLowerCase()
        )
      });
      
      if (caseInsensitiveMatch) {
        console.log(`Found case-insensitive match for ${normalizedQuery}`);
        return res.json([caseInsensitiveMatch]);
      }
      
      // Check for demo genes
      const demoGenes = ['AT1G25320', 'AT3G15500', 'AT5G20320'];
      
      if (demoGenes.includes(normalizedQuery)) {
        console.log(`Using demo data for ${normalizedQuery}`);
        
        const demoGeneData = {
          "AT1G25320": {
            gene_id: "AT1G25320",
            chromosome: "Chr1",
            start_position: 8863550,
            end_position: 8866320,
            strand: "+",
            description: "Leucine-rich repeat (LRR) family protein"
          },
          "AT3G15500": {
            gene_id: "AT3G15500",
            chromosome: "Chr3",
            start_position: 5242700,
            end_position: 5246820,
            strand: "+",
            description: "NAC domain containing protein 3"
          },
          "AT5G20320": {
            gene_id: "AT5G20320",
            chromosome: "Chr5",
            start_position: 6865400,
            end_position: 6868200,
            strand: "-",
            description: "DCL4 (DICER-LIKE 4); ribonuclease III"
          }
        };
        
        return res.json([demoGeneData[normalizedQuery]]);
      }
      
      // Return empty results if no exact match found
      return res.json([]);
    }
    
    // General search by gene_id or description
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
    
    // If database search returns results, return them
    if (genes.length > 0) {
      return res.json(genes);
    }
    
    // Check if query might match demo genes
    if (query.match(/^AT/i) || query.toLowerCase().includes('repeat') || 
        query.toLowerCase().includes('nac') || query.toLowerCase().includes('dicer')) {
      
      // Demo genes for fallback
      const demoGenes = [
        {
          gene_id: "AT1G25320",
          chromosome: "Chr1",
          start_position: 8863550,
          end_position: 8866320,
          strand: "+",
          description: "Leucine-rich repeat (LRR) family protein"
        },
        {
          gene_id: "AT3G15500",
          chromosome: "Chr3",
          start_position: 5242700,
          end_position: 5246820,
          strand: "+",
          description: "NAC domain containing protein 3"
        },
        {
          gene_id: "AT5G20320",
          chromosome: "Chr5",
          start_position: 6865400,
          end_position: 6868200,
          strand: "-",
          description: "DCL4 (DICER-LIKE 4); ribonuclease III"
        }
      ];
      
      // Filter demo genes that match the query
      const matchingDemoGenes = demoGenes.filter(gene => 
        gene.gene_id.toLowerCase().includes(query.toLowerCase()) ||
        gene.description.toLowerCase().includes(query.toLowerCase())
      );
      
      if (matchingDemoGenes.length > 0) {
        console.log(`Found ${matchingDemoGenes.length} matching demo genes`);
        return res.json(matchingDemoGenes);
      }
    }
    
    // No matches found, return empty array
    return res.json([]);
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