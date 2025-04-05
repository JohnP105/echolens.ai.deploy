import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button, 
  Chip,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';

// Motion components
const MotionAppBar = motion(AppBar);
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);
const MotionChip = motion(Chip);
const MotionToolbar = motion(Toolbar);
const MotionIconButton = motion(IconButton);

const Header = ({ emotionalState, darkMode, toggleDarkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

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

  const iconButtonVariants = {
    hover: { 
      scale: 1.2, 
      rotate: 5, 
      transition: { type: "spring", stiffness: 400 } 
    },
    tap: { scale: 0.9 }
  };

  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  // Notification button with pulse animation
  const NotificationButton = () => (
    <Tooltip title="Notifications">
      <MotionIconButton
        color="inherit"
        sx={{ ml: 1 }}
        whileHover="hover"
        whileTap="tap"
        variants={iconButtonVariants}
      >
        <Box sx={{ position: 'relative' }}>
          <NotificationsIcon />
          <Box 
            component={motion.div}
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.3, 1],
              transition: { repeat: 3, duration: 0.6 }
            }}
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: 'error.main'
            }}
          />
        </Box>
      </MotionIconButton>
    </Tooltip>
  );
  
  return (
    <MotionAppBar 
      position="sticky" 
      color="default" 
      elevation={scrolled ? 4 : 0}
      sx={{ 
        bgcolor: darkMode 
          ? (scrolled ? 'rgba(18, 18, 18, 0.95)' : 'rgba(18, 18, 18, 0.7)')
          : (scrolled ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.7)'),
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
            <SmartToyIcon 
              color="primary" 
              sx={{ 
                fontSize: 32,
                filter: darkMode ? 'drop-shadow(0 0 2px rgba(33, 150, 243, 0.5))' : 'none'
              }} 
            />
          </MotionBox>
          <MotionTypography 
            variant={isMobile ? "h6" : "h5"} 
            component="div" 
            sx={{ 
              fontWeight: 'bold', 
              background: 'linear-gradient(45deg, #2196f3, #21CBF3)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent',
              textShadow: darkMode ? '0 0 10px rgba(33, 150, 243, 0.3)' : 'none'
            }}
            whileHover={{ scale: 1.05 }}
          >
            RoboMind
          </MotionTypography>
        </MotionBox>

        {/* Navigation menu - Desktop */}
        <MotionBox 
          sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center',
            ml: 'auto'
          }}
        >
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
                sx={{ mr: 2 }}
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
          
          {/* Action buttons */}
          <Box sx={{ display: 'flex', ml: 2 }}>
            <NotificationButton />
            
            <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
              <MotionIconButton 
                color="inherit" 
                onClick={toggleDarkMode}
                sx={{ ml: 1 }}
                whileHover="hover"
                whileTap="tap"
                variants={iconButtonVariants}
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </MotionIconButton>
            </Tooltip>
          </Box>
        </MotionBox>

        {/* Mobile menu button */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, ml: 'auto' }}>
          {emotionalState && emotionalState.emotion !== 'neutral' && (
            <Chip
              icon={icon}
              label={emotionalState.emotion}
              color={color}
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          <NotificationButton />
          <Tooltip title={darkMode ? "Light Mode" : "Dark Mode"}>
            <MotionIconButton 
              color="inherit" 
              onClick={toggleDarkMode}
              sx={{ ml: 1 }}
              whileHover="hover"
              whileTap="tap"
              variants={iconButtonVariants}
            >
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </MotionIconButton>
          </Tooltip>
          <IconButton 
            color="inherit" 
            edge="end" 
            onClick={handleMobileMenuOpen}
            sx={{ ml: 1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Mobile menu */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={handleMobileMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {[
            { path: '/', label: 'Dashboard' },
            { path: '/analysis', label: 'Emotion Analysis' },
            { path: '/chat', label: 'Chat' },
            { path: '/settings', label: 'Settings' }
          ].map((item) => (
            <MenuItem 
              key={item.path} 
              component={RouterLink} 
              to={item.path}
              onClick={handleMobileMenuClose}
              selected={isActive(item.path)}
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </MotionToolbar>
    </MotionAppBar>
  );
};

export default Header; 