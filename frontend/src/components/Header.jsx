import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';

const Header = ({ emotionalState }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get the appropriate emotion icon and color based on the detected emotion
  const getEmotionIconAndColor = (emotion) => {
    switch (emotion?.toLowerCase()) {
      case 'happy':
      case 'joy':
        return { icon: <SentimentSatisfiedAltIcon />, color: 'success' };
      case 'sad':
      case 'angry':
      case 'fear':
      case 'disgust':
        return { icon: <SentimentVeryDissatisfiedIcon />, color: 'error' };
      default:
        return { icon: <SentimentNeutralIcon />, color: 'primary' };
    }
  };

  const { icon, color } = getEmotionIconAndColor(emotionalState?.emotion);

  return (
    <AppBar position="static">
      <Toolbar>
        <SmartToyIcon sx={{ mr: 2 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, fontWeight: 'bold' }}
        >
          RoboMind
        </Typography>

        {/* Navigation menu */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Emotion display */}
          {emotionalState && (
            <Chip
              icon={icon}
              label={emotionalState.emotion || 'Neutral'}
              color={color}
              size={isMobile ? 'small' : 'medium'}
              sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
            />
          )}

          {/* Navigation buttons */}
          <Box sx={{ '& > *': { mx: 0.5 } }}>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/"
              size={isMobile ? 'small' : 'medium'}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/analysis"
              size={isMobile ? 'small' : 'medium'}
            >
              Emotion Analysis
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/chat"
              size={isMobile ? 'small' : 'medium'}
            >
              Chat
            </Button>
            <Button 
              color="inherit" 
              component={RouterLink} 
              to="/settings"
              size={isMobile ? 'small' : 'medium'}
            >
              Settings
            </Button>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 