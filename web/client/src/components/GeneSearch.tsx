import React, { useState, useEffect } from 'react';
import { 
  TextField, 
  Autocomplete, 
  Box, 
  Button, 
  CircularProgress, 
  Paper, 
  Typography 
} from '@mui/material';
import { searchGenes } from '../services/api';
import { Gene } from '../types';

interface GeneSearchProps {
  onGeneSelect: (geneId: string) => void;
  initialGeneId?: string;
}

const GeneSearch: React.FC<GeneSearchProps> = ({ onGeneSelect, initialGeneId }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGene, setSelectedGene] = useState<Gene | null>(null);
  const [options, setOptions] = useState<Gene[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [noResults, setNoResults] = useState<boolean>(false);

  // Handle search when search term changes
  useEffect(() => {
    const fetchGenes = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setOptions([]);
        setNoResults(false);
        return;
      }

      setLoading(true);
      setNoResults(false);
      
      try {
        const results = await searchGenes(searchTerm);
        setOptions(results);
        setNoResults(results.length === 0);
      } catch (error) {
        console.error('Error searching genes:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchGenes();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm]);
  
  // Load initial suggestions when component mounts
  useEffect(() => {
    const loadInitialSuggestions = async () => {
      setLoading(true);
      try {
        // Load some initial suggestions with a common prefix
        const results = await searchGenes('AT1G');
        setOptions(results);
      } catch (error) {
        console.error('Error loading initial suggestions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialSuggestions();
  }, []);

  // Function to perform the search
  const performSearch = () => {
    // Don't do anything if button would be disabled
    if (loading || (!selectedGene && !searchTerm.match(/^AT[1-5]G\d+$/i))) {
      console.log("Search blocked due to validation", { loading, selectedGene, searchTerm });
      return;
    }
    
    console.log("Search performed", { selectedGene, searchTerm });
    
    if (selectedGene) {
      console.log("Searching with selected gene:", selectedGene.gene_id);
      onGeneSelect(selectedGene.gene_id);
    } else if (searchTerm && searchTerm.match(/^AT[1-5]G\d+$/i)) {
      // If input matches Arabidopsis gene ID pattern, treat as a direct gene ID search
      console.log("Searching with direct gene ID:", searchTerm.toUpperCase());
      onGeneSelect(searchTerm.toUpperCase());
    }
  };
  
  // Handle form submission
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    performSearch();
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Search for Arabidopsis T-DNA Lines
      </Typography>
      
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
        noValidate
        autoComplete="off"
      >
        <Autocomplete
          id="gene-search"
          options={options}
          getOptionLabel={(option) => `${option.gene_id} (${option.description.substring(0, 30)}...)`}
          filterOptions={(x) => x} // Server-side filtering is used instead
          open={options.length > 0 || loading} // Keep dropdown open when options exist or loading
          loading={loading}
          loadingText="Searching genes..."
          noOptionsText={noResults ? "No genes found" : "Type to search"}
          sx={{ width: 400 }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Gene ID or name"
              placeholder="e.g., AT1G25320"
              helperText="Enter Arabidopsis gene ID (e.g., AT1G25320) or keyword"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <React.Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </React.Fragment>
                ),
              }}
            />
          )}
          value={selectedGene}
          onChange={(_, newValue) => {
            console.log("Selection changed:", newValue);
            setSelectedGene(newValue);
            if (newValue) {
              console.log("Selection made, triggering search with:", newValue.gene_id);
              // If a selection is made from dropdown, trigger search immediately
              onGeneSelect(newValue.gene_id);
            }
          }}
          inputValue={searchTerm}
          onInputChange={(_, newInputValue) => {
            setSearchTerm(newInputValue);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              performSearch();
            }
          }}
          autoComplete
          autoHighlight
          disablePortal={false}
        />
        
        <Button 
          type="button" 
          variant="contained" 
          color="primary"
          disabled={loading || (!selectedGene && !searchTerm.match(/^AT[1-5]G\d+$/i))}
          onClick={() => {
            console.log("Search button clicked");
            performSearch();
          }}
        >
          Search T-DNA Lines
        </Button>
      </Box>
    </Paper>
  );
};

export default GeneSearch;