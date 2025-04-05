import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Chip,
  useMediaQuery,
  useTheme 
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons for emotional states
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SmartToyIcon from '@mui/icons-material/SmartToy';

// Motion components
const MotionAppBar = motion(AppBar);
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionChip = motion(Chip);
const MotionToolbar = motion(Toolbar);

const Header = ({ emotionalState }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  // Monitor scroll position to change header style
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Determine emotion icon
  let icon = <SentimentNeutralIcon />;
  let color = 'default';

  if (emotionalState) {
    if (['happy', 'excited', 'content'].includes(emotionalState.emotion)) {
      icon = <SentimentSatisfiedAltIcon />;
      color = 'success';
    } else if (['sad', 'angry', 'anxious', 'stressed', 'depressed'].includes(emotionalState.emotion)) {
      icon = <SentimentVeryDissatisfiedIcon />;
      color = 'error';
    }
  }

  // Determine active route for highlighted menu
  const isActive = (path) => location.pathname === path;

  // Animation variants
  const navVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const logoVariants = {
    initial: { x: -30, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <MotionAppBar 
      position="sticky" 
      color="default" 
      elevation={scrolled ? 4 : 0}
      sx={{ 
        bgcolor: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease'
      }}
      initial="initial"
      animate="animate"
      variants={navVariants}
    >
      <MotionToolbar>
        {/* Logo and title */}
        <MotionBox 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mr: 3,
            flexGrow: { xs: 1, md: 0 } 
          }}
          variants={logoVariants}
        >
          <MotionBox
            animate={{ 
              rotate: [0, 5, 0, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            sx={{ mr: 1, display: 'flex', alignItems: 'center' }}
          >
            <SmartToyIcon color="primary" sx={{ fontSize: 32 }} />
          </MotionBox>
          <MotionTypography 
            variant={isMobile ? "h6" : "h5"} 
            component="div" 
            sx={{ fontWeight: 'bold', background: 'linear-gradient(45deg, #2196f3, #21CBF3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            whileHover={{ scale: 1.05 }}
          >
            RoboMind
          </MotionTypography>
        </MotionBox>

        {/* Navigation menu */}
        <MotionBox sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Emotion display */}
          <AnimatePresence mode="wait">
            {emotionalState && (
              <MotionChip
                key={emotionalState.emotion}
                component={motion.div}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                icon={icon}
                label={emotionalState.emotion || 'Neutral'}
                color={color}
                size={isMobile ? 'small' : 'medium'}
                sx={{ mr: 2, display: { xs: 'none', sm: 'flex' } }}
              />
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <MotionBox sx={{ '& > *': { mx: 0.5 } }}>
            {[
              { path: '/', label: 'Dashboard' },
              { path: '/analysis', label: 'Emotion Analysis' },
              { path: '/chat', label: 'Chat' },
              { path: '/settings', label: 'Settings' }
            ].map((item) => (
              <Button 
                key={item.path}
                component={RouterLink} 
                to={item.path}
                color="inherit"
                size={isMobile ? 'small' : 'medium'}
                sx={{ 
                  position: 'relative',
                  '&:after': isActive(item.path) ? {
                    content: '""',
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    width: '100%',
                    height: '3px',
                    background: theme.palette.primary.main,
                    borderRadius: '4px 4px 0 0'
                  } : {}
                }}
              >
                {item.label}
                {isActive(item.path) && (
                  <MotionBox
                    layoutId="activeIndicator"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: theme.palette.primary.main,
                      borderRadius: '4px 4px 0 0'
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Button>
            ))}
          </MotionBox>
        </MotionBox>
      </MotionToolbar>
    </MotionAppBar>
  );
};

export default Header; 