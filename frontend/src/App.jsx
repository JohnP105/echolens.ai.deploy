import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import our UI components
import EchoLensUI from './components/EchoLensUI';
import ChatInterface from './components/ChatInterface';

function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [emotionalState, setEmotionalState] = useState({ emotion: 'neutral', intensity: 'medium' });

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Update emotional state - can be called from AudioVisualization component
  const updateEmotionalState = (newState) => {
    setEmotionalState(newState);
  };

  // Create a dynamic theme based on the mode
  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
      background: {
        default: 'transparent', // Make default background transparent to show gradient
        paper: darkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)', // Semi-transparent paper
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
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundAttachment: 'fixed',
            margin: 0,
            padding: 0
          },
          // Add smooth transition for all color changes
          '*, *::before, *::after': {
            transition: 'background-color 0.5s ease, border-color 0.5s ease, color 0.3s ease, box-shadow 0.3s ease',
          },
        },
      },
    },
  }), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route 
            path="/" 
            element={<EchoLensUI 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
              emotionalState={emotionalState}
              updateEmotionalState={updateEmotionalState}
            />} 
          />
          <Route 
            path="/chat" 
            element={<ChatInterface 
              darkMode={darkMode} 
              emotionalState={emotionalState} 
            />} 
          />
          <Route 
            path="*" 
            element={<EchoLensUI 
              darkMode={darkMode} 
              toggleDarkMode={toggleDarkMode}
              emotionalState={emotionalState}
              updateEmotionalState={updateEmotionalState}
            />} 
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App; 