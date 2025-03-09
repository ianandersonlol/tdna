import React, { useEffect, useRef } from 'react';
import * as igv from 'igv';
import { Box, CircularProgress, Typography } from '@mui/material';
import { VisualizationData } from '../types';

interface GenomeBrowserProps {
  visualizationData: VisualizationData | null;
  isLoading: boolean;
  colorblindFriendly: boolean;
}

const GenomeBrowser: React.FC<GenomeBrowserProps> = ({ 
  visualizationData, 
  isLoading,
  colorblindFriendly
}) => {
  const igvContainer = useRef<HTMLDivElement>(null);
  const igvBrowser = useRef<any>(null);

  // Clean up IGV browser when component unmounts
  useEffect(() => {
    return () => {
      if (igvBrowser.current) {
        igvBrowser.current.dispose();
      }
    };
  }, []);

  // Initialize or update IGV browser when visualization data changes
  useEffect(() => {
    if (!visualizationData || isLoading || !igvContainer.current) return;

    const initIGV = async () => {
      // Dispose of existing browser instance
      if (igvBrowser.current) {
        igvBrowser.current.dispose();
      }

      // Define color scheme based on colorblind preference
      const colorScheme = colorblindFriendly 
        ? {
            exon: '#0072B2', // Blue
            CDS: '#D55E00', // Vermilion
            UTR: '#009E73',  // Green
            insertion: '#CC79A7' // Pink
          }
        : {
            exon: '#4285F4', // Blue
            CDS: '#EA4335',  // Red
            UTR: '#34A853',  // Green
            insertion: '#FBBC05' // Yellow
          };

      // Create GFF-like features from our data
      const geneFeatures = visualizationData.features.map(feature => ({
        chr: visualizationData.gene.chromosome,
        start: feature.start,
        end: feature.end,
        type: feature.type,
        strand: feature.strand,
        name: feature.type,
        color: feature.type.includes('CDS') 
          ? colorScheme.CDS 
          : feature.type.includes('UTR') 
            ? colorScheme.UTR 
            : colorScheme.exon
      }));

      // Create T-DNA insertion features
      const tdnaFeatures = visualizationData.tdnaInsertions.map(insertion => ({
        chr: insertion.chromosome,
        start: insertion.position - 5,  // Slight offset for visibility
        end: insertion.position + 5,
        type: 'insertion',
        name: insertion.line_id,
        description: `${insertion.line_id} (${insertion.hit_region}, ${insertion.homozygosity_status})`,
        color: colorScheme.insertion
      }));

      // Combine all features
      const allFeatures = [...geneFeatures, ...tdnaFeatures];

      // Define genome
      const genome = {
        id: 'arabidopsis',
        name: 'Arabidopsis thaliana (TAIR10)',
        fastaURL: 'https://s3.amazonaws.com/igv.org.genomes/tair10/TAIR10.fa',
        indexURL: 'https://s3.amazonaws.com/igv.org.genomes/tair10/TAIR10.fa.fai',
        tracks: [
          {
            name: `${visualizationData.gene.id} Gene Structure`,
            type: 'annotation',
            format: 'bed',
            displayMode: 'EXPANDED',
            features: allFeatures,
            visibilityWindow: 1000000
          }
        ]
      };

      try {
        // Initialize IGV browser
        igvBrowser.current = await igv.createBrowser(igvContainer.current, {
          genome: genome,
          locus: `${visualizationData.gene.chromosome}:${visualizationData.gene.start - 100}-${visualizationData.gene.end + 100}`,
          tracks: []
        });
      } catch (error) {
        console.error('Error initializing IGV browser:', error);
      }
    };

    initIGV();
  }, [visualizationData, isLoading, colorblindFriendly]);

  return (
    <Box width="100%" height="600px" display="flex" flexDirection="column">
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
          <CircularProgress />
        </Box>
      ) : !visualizationData ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="600px">
          <Typography variant="h5">No visualization data available</Typography>
        </Box>
      ) : (
        <div
          ref={igvContainer}
          style={{ width: '100%', height: '600px' }}
          data-testid="igv-container"
        />
      )}
    </Box>
  );
};

export default GenomeBrowser;