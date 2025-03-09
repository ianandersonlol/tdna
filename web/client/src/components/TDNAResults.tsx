import React from 'react';
import { 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Chip,
  CircularProgress,
  Button,
  Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { TDNALine } from '../types';

interface TDNAResultsProps {
  geneId: string | null;
  tdnaLines: TDNALine[];
  isLoading: boolean;
}

const TDNAResults: React.FC<TDNAResultsProps> = ({ geneId, tdnaLines, isLoading }) => {
  // Function to export results as CSV
  const exportToCSV = () => {
    if (!tdnaLines.length) return;
    
    // Create CSV header
    const header = ['Line ID', 'Target Gene', 'Hit Region', 'Homozygosity', 'Stock Center'];
    
    // Create CSV rows from T-DNA lines
    const rows = tdnaLines.map(line => [
      line.line_id,
      line.target_gene,
      line.hit_region || 'N/A',
      line.homozygosity_status || 'N/A',
      line.stock_center_status || 'N/A'
    ]);
    
    // Combine header and rows
    const csvContent = [
      header.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tdna_lines_${geneId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render loading state
  if (isLoading) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Render empty state when no gene is selected
  if (!geneId) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" align="center" sx={{ my: 4 }}>
          Search for a gene to find T-DNA insertion lines
        </Typography>
      </Paper>
    );
  }

  // Render no results state
  if (tdnaLines.length === 0) {
    return (
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          T-DNA Lines for {geneId}
        </Typography>
        <Typography variant="body1" align="center" sx={{ my: 4 }}>
          No T-DNA insertion lines found for this gene
        </Typography>
      </Paper>
    );
  }

  // Render results
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">
          T-DNA Lines for {geneId} ({tdnaLines.length} {tdnaLines.length === 1 ? 'line' : 'lines'})
        </Typography>
        
        <Tooltip title="Download as CSV">
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={exportToCSV}
          >
            Export
          </Button>
        </Tooltip>
      </Box>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Line ID</strong></TableCell>
              <TableCell><strong>Hit Region</strong></TableCell>
              <TableCell><strong>Homozygosity</strong></TableCell>
              <TableCell><strong>Stock Center</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tdnaLines.map((line) => (
              <TableRow key={line.line_id}>
                <TableCell>{line.line_id}</TableCell>
                <TableCell>
                  <Chip 
                    label={line.hit_region || 'Unknown'} 
                    size="small"
                    color={
                      line.hit_region?.includes('exon') ? 'error' : 
                      line.hit_region?.includes('intron') ? 'warning' :
                      line.hit_region?.includes('UTR') ? 'info' : 'default'
                    }
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>{line.homozygosity_status || 'N/A'}</TableCell>
                <TableCell>{line.stock_center_status || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TDNAResults;