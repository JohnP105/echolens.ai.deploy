import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, Paper } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import EmotionAnalysis from './components/EmotionAnalysis';
import ChatInterface from './components/ChatInterface';
import Settings from './components/Settings';

// Create theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// Layout component with AnimatePresence
const AnimatedRoutes = ({ emotionalState, updateEmotionalState }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard emotionalState={emotionalState} />} />
        <Route
          path="/analysis"
          element={<EmotionAnalysis updateEmotionalState={updateEmotionalState} />}
        />
        <Route
          path="/chat"
          element={<ChatInterface emotionalState={emotionalState} />}
        />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [emotionalState, setEmotionalState] = useState({
    emotion: 'neutral',
    sentiment: 'neutral',
    intensity: 'low',
  });

  const updateEmotionalState = (newState) => {
    setEmotionalState(newState);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          <Header emotionalState={emotionalState} />
          <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <AnimatedRoutes 
              emotionalState={emotionalState} 
              updateEmotionalState={updateEmotionalState} 
            />
          </Container>
          <Footer />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App; 