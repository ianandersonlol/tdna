import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Switch, FormControlLabel, Divider } from '@mui/material';
import GeneSearch from '../components/GeneSearch';
import TDNAResults from '../components/TDNAResults';
import GenomeBrowser from '../components/GenomeBrowser';
import { getTDNALines, getVisualizationData } from '../services/api';
import { TDNALine, VisualizationData } from '../types';

const HomePage: React.FC = () => {
  const [selectedGeneId, setSelectedGeneId] = useState<string | null>(null);
  const [tdnaLines, setTdnaLines] = useState<TDNALine[]>([]);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);
  const [loadingTdnaLines, setLoadingTdnaLines] = useState<boolean>(false);
  const [loadingVisualization, setLoadingVisualization] = useState<boolean>(false);
  const [colorblindFriendly, setColorblindFriendly] = useState<boolean>(true);
  
  // Fetch T-DNA lines when a gene is selected
  useEffect(() => {
    const fetchTDNALines = async () => {
      if (!selectedGeneId) return;
      
      setLoadingTdnaLines(true);
      setTdnaLines([]);
      
      try {
        const lines = await getTDNALines(selectedGeneId);
        setTdnaLines(lines);
      } catch (error) {
        console.error('Error fetching T-DNA lines:', error);
      } finally {
        setLoadingTdnaLines(false);
      }
    };
    
    // Fetch visualization data
    const fetchVisualizationData = async () => {
      if (!selectedGeneId) return;
      
      setLoadingVisualization(true);
      setVisualizationData(null);
      
      try {
        const data = await getVisualizationData(selectedGeneId);
        setVisualizationData(data);
      } catch (error) {
        console.error('Error fetching visualization data:', error);
      } finally {
        setLoadingVisualization(false);
      }
    };
    
    // Fetch both in parallel
    if (selectedGeneId) {
      fetchTDNALines();
      fetchVisualizationData();
    }
  }, [selectedGeneId]);
  
  // Handle gene selection
  const handleGeneSelect = (geneId: string) => {
    setSelectedGeneId(geneId);
  };
  
  // Toggle colorblind-friendly mode
  const handleColorblindToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setColorblindFriendly(event.target.checked);
  };

  return (
    <Container maxWidth="xl">
      <Box my={4}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Arabidopsis T-DNA Insertion Visualization
        </Typography>
        
        <GeneSearch onGeneSelect={handleGeneSelect} />
        
        {selectedGeneId && (
          <>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={colorblindFriendly}
                    onChange={handleColorblindToggle}
                    color="primary"
                  />
                }
                label="Colorblind-friendly mode"
              />
            </Box>
            
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                T-DNA Insertion Lines
              </Typography>
              <TDNAResults 
                geneId={selectedGeneId} 
                tdnaLines={tdnaLines} 
                isLoading={loadingTdnaLines} 
              />
            </Box>
            
            <Divider sx={{ my: 4 }} />
            
            <Box mb={4}>
              <Typography variant="h6" gutterBottom>
                Gene Visualization
              </Typography>
              <GenomeBrowser 
                visualizationData={visualizationData} 
                isLoading={loadingVisualization}
                colorblindFriendly={colorblindFriendly}
              />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;