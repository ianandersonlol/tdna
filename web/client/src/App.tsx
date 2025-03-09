import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Link, Box } from '@mui/material';
import HomePage from './pages/HomePage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32', // Green - plant-themed color
    },
    secondary: {
      main: '#1976d2', // Blue for accent
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static" color="primary">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Arabidopsis T-DNA Viewer
            </Typography>
            <Link color="inherit" href="https://github.com/ianandersonlol/tdna" target="_blank" sx={{ mx: 2 }}>
              GitHub
            </Link>
            <Link color="inherit" href="https://arabidopsis.org" target="_blank">
              TAIR
            </Link>
          </Toolbar>
        </AppBar>
        
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
        
        <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'primary.main', color: 'white' }}>
          <Typography variant="body2" align="center">
            &copy; {new Date().getFullYear()} Arabidopsis T-DNA Visualization Tool
          </Typography>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
