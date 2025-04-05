import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem,
  Button,
  Chip,
  Tooltip,
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { motion, useScroll, AnimatePresence } from 'framer-motion';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import HearingIcon from '@mui/icons-material/Hearing';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';

// Motion components
const MotionBox = motion(Box);
const MotionIconButton = motion(IconButton);
const MotionTab = ({ active, ...props }) => (
  <Tab 
    component={motion.div}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    sx={{ 
      opacity: active ? 1 : 0.7,
      fontWeight: active ? 'bold' : 'normal',
      '&::after': active ? {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '3px',
        bgcolor: 'primary.main',
        borderRadius: '4px 4px 0 0'
      } : null
    }}
    {...props}
  />
);

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
    <MotionBox
      component={motion.div}
      variants={navVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      sx={{ flexGrow: 1, mb: 4 }}
    >
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: 'transparent', 
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          color: 'text.primary'
        }}
      >
        <MotionBox
          component={Toolbar}
          sx={{ justifyContent: 'space-between' }}
        >
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MotionBox
              component={motion.div}
              variants={logoVariants}
              whileHover={{ rotate: 5 }}
              sx={{ display: 'flex', alignItems: 'center', mr: 1 }}
            >
              <HearingIcon sx={{ fontSize: 28, color: 'primary.main', mr: 1 }} />
              <Typography variant="h6" noWrap component={RouterLink} to="/" sx={{ 
                fontWeight: 'bold',
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center'
              }}>
                EchoLens<Box component="span" sx={{ color: 'primary.main' }}>.AI</Box>
              </Typography>
            </MotionBox>
          </Box>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            <MotionTab
              component={RouterLink}
              to="/"
              label="Home"
              icon={<HomeIcon />}
              active={isActive('/')}
            />
            <MotionTab
              component={RouterLink}
              to="/settings"
              label="Settings"
              icon={<SettingsIcon />}
              active={isActive('/settings')}
            />
            
            {emotionalState && emotionalState.emotion !== 'neutral' && (
              <Chip
                icon={icon}
                label={emotionalState.emotion}
                color={color}
                size="small"
                sx={{ ml: 2 }}
              />
            )}
            
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
          </Box>

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
        </MotionBox>
      </AppBar>
    </MotionBox>
  );
};

export default Header; 