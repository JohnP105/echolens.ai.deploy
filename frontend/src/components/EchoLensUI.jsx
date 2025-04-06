import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  Tabs,
  Tab,
  Grid,
  Button,
  useTheme,
  Chip,
  Card,
  CardContent
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import HearingIcon from '@mui/icons-material/Hearing';
import SurroundSoundIcon from '@mui/icons-material/SurroundSound';
import SettingsIcon from '@mui/icons-material/Settings';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import ChatIcon from '@mui/icons-material/Chat';
import MicIcon from '@mui/icons-material/Mic';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VideocamIcon from '@mui/icons-material/Videocam';

// Import the Audio Visualization component
import AudioVisualization from './AudioVisualization';
import ChatInterface from './ChatInterface';
import Dashboard from './Dashboard';
import MultimodalAnalysis from './MultimodalAnalysis';
import Header, { PageTitle } from './Header';

// Animated MUI components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionTypography = motion(Typography);
const MotionButton = motion(Button);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

// Styled components
const MainContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  height: '100vh',
  overflowY: 'auto',
  overflowX: 'hidden'
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2),
  justifyContent: 'center',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText
}));

const drawerWidth = 240;

const EchoLensUI = ({ darkMode, toggleDarkMode, emotionalState, updateEmotionalState }) => {
  const theme = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Toggle drawer
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle emotional state updates from AudioVisualization
  const handleEmotionalStateUpdate = (newState) => {
    if (updateEmotionalState) {
      updateEmotionalState(newState);
    }
  };
  
  return (
    <>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            EchoLens.AI
          </Typography>
          
          <IconButton color="inherit" onClick={toggleDarkMode}>
            {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Side Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          '& .MuiDrawer-paper': { width: drawerWidth }
        }}
      >
        <DrawerHeader>
          <Typography variant="h6">
            EchoLens.AI
          </Typography>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem button onClick={() => setActiveTab(0)}>
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab(1)}>
            <ListItemIcon>
              <HearingIcon />
            </ListItemIcon>
            <ListItemText primary="Audio Panel" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab(2)}>
            <ListItemIcon>
              <SurroundSoundIcon />
            </ListItemIcon>
            <ListItemText primary="Spatial Audio" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab(3)}>
            <ListItemIcon>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText primary="Chat" />
          </ListItem>
          <ListItem button onClick={() => setActiveTab(4)}>
            <ListItemIcon>
              <VideocamIcon />
            </ListItemIcon>
            <ListItemText primary="Multimodal Analysis" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <HelpOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Help" />
          </ListItem>
          <ListItem button>
            <ListItemIcon>
              <InfoIcon />
            </ListItemIcon>
            <ListItemText primary="About" />
          </ListItem>
        </List>
      </Drawer>
      
      {/* Main Content */}
      <Box sx={{ 
        flexGrow: 1,
        pt: 10, // Add padding to account for app bar
        px: 3,
        minHeight: '100vh',
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
          : 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
      }}>
        <MainContainer maxWidth="xl">
          {/* Only show title and description on Dashboard tab */}
          {activeTab === 0 && (
            <PageTitle 
              title="EchoLens.AI" 
              subtitle="Audio Accessibility Tool" 
            />
          )}
          
          {/* Tabs */}
          <Paper 
            elevation={3} 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              background: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{ 
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                },
                '& .MuiTab-root': {
                  minWidth: '120px'
                }
              }}
            >
              <Tab 
                label="Dashboard" 
                icon={<HomeIcon />} 
                iconPosition="start"
                sx={{ 
                  fontSize: '0.9rem', 
                  textTransform: 'none', 
                  fontWeight: activeTab === 0 ? 'bold' : 'normal',
                  opacity: activeTab === 0 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} 
              />
              <Tab 
                label="Audio" 
                icon={<MicIcon />} 
                iconPosition="start"
                sx={{ 
                  fontSize: '0.9rem', 
                  textTransform: 'none', 
                  fontWeight: activeTab === 1 ? 'bold' : 'normal',
                  opacity: activeTab === 1 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} 
              />
              <Tab 
                label="Spatial" 
                icon={<SurroundSoundIcon />}
                iconPosition="start" 
                sx={{ 
                  fontSize: '0.9rem', 
                  textTransform: 'none', 
                  fontWeight: activeTab === 2 ? 'bold' : 'normal',
                  opacity: activeTab === 2 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} 
              />
              <Tab 
                label="Chat" 
                icon={<ChatIcon />} 
                iconPosition="start"
                sx={{ 
                  fontSize: '0.9rem', 
                  textTransform: 'none', 
                  fontWeight: activeTab === 3 ? 'bold' : 'normal',
                  opacity: activeTab === 3 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} 
              />
              <Tab 
                label="Multimodal" 
                icon={<VideocamIcon />} 
                iconPosition="start"
                sx={{ 
                  fontSize: '0.9rem', 
                  textTransform: 'none', 
                  fontWeight: activeTab === 4 ? 'bold' : 'normal',
                  opacity: activeTab === 4 ? 1 : 0.7,
                  transition: 'all 0.2s ease',
                }} 
              />
            </Tabs>
          </Paper>
          
          {/* Main Content Area */}
          {/* Dashboard Tab */}
          {activeTab === 0 && (
            <Dashboard 
              darkMode={darkMode} 
              emotionalState={emotionalState}
              setActiveTab={setActiveTab}
            />
          )}
          
          {/* Speech Recognition Tab */}
          {activeTab === 1 && (
            <MotionBox
              component={motion.div}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <MotionPaper 
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  borderRadius: 4,
                  background: 'linear-gradient(120deg, #2196f3 0%, #21cbf3 100%)',
                  color: 'white',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <MotionBox
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <MotionTypography 
                      variant="h3" 
                      gutterBottom 
                      fontWeight="bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      Speech Recognition
                    </MotionTypography>
                    <MotionTypography 
                      variant="h5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Understand Spoken Language & Emotions
                    </MotionTypography>
                    <MotionTypography 
                      variant="body1" 
                      sx={{ mt: 2 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      Our advanced speech recognition system transcribes spoken language in real-time and analyzes 
                      emotional tone, helping you understand not just what people are saying, but how they're saying it.
                      This provides crucial emotional context for your conversations.
                    </MotionTypography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <MotionBox
                      component={motion.div}
                      animate={{
                        scale: [1, 1.05, 1],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }
                      }}
                    >
                      <HearingIcon sx={{ 
                        fontSize: 160, 
                        opacity: 0.9,
                        filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
                      }} />
                    </MotionBox>
                  </Grid>
                </Grid>
              </MotionPaper>
              
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                      height: '100%',
                    borderRadius: 2, 
                    background: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                    color: darkMode ? 'white' : 'inherit',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    whileHover={{ y: -5, boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)" }}
                  >
                    <MotionBox
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: 'linear-gradient(90deg, #2196f3, #21cbf3)'
                      }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    
                  <Typography variant="h5" gutterBottom>
                      <MicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Voice Transcription
                  </Typography>
                  <Typography variant="body1" paragraph>
                      Our advanced speech recognition model captures spoken language with high accuracy even in noisy environments.
                  </Typography>
                  <Typography variant="body1" paragraph>
                      It works with multiple languages and different accents, making it accessible to a diverse range of users.
                    </Typography>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Key Features:
                  </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        <Chip label="Real-time" size="small" color="primary" />
                        <Chip label="Multi-language" size="small" color="primary" />
                        <Chip label="Noise-resistant" size="small" color="primary" />
                        <Chip label="High accuracy" size="small" color="primary" />
                      </Box>
                  </Box>
                  </MotionPaper>
              </Grid>
                
              <Grid item xs={12} md={6}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
                  elevation={3} 
                  sx={{ 
                    p: 3, 
                      height: '100%',
                    borderRadius: 2, 
                    background: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                    color: darkMode ? 'white' : 'inherit',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    whileHover={{ y: -5, boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)" }}
                  >
                    <MotionBox
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: 'linear-gradient(90deg, #f50057, #ff4081)'
                      }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                    
                  <Typography variant="h5" gutterBottom>
                      <VisibilityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Emotion Detection
                  </Typography>
                  <Typography variant="body1" paragraph>
                      Our AI analyzes speech patterns, tone, and linguistic markers to identify emotions in conversations.
                  </Typography>
                  <Typography variant="body1" paragraph>
                      This provides crucial emotional context that might otherwise be missed by deaf and hard-of-hearing users.
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Detectable Emotions:
                  </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {['happy', 'sad', 'angry', 'excited', 'confused', 'frustrated', 'neutral', 'surprised'].map(emotion => (
                          <Chip 
                            key={emotion}
                            label={emotion.charAt(0).toUpperCase() + emotion.slice(1)} 
                            sx={{ 
                              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(33, 150, 243, 0.5)'
                            }} 
                          />
                        ))}
                      </Box>
                    </Box>
                  </MotionPaper>
                </Grid>
                
                <Grid item xs={12}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={3}
                    sx={{ 
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'transparent'
                    }}
                  >
                    <AudioVisualization 
                      mode="speech" 
                      onEmotionDetected={handleEmotionalStateUpdate}
                      visualStyle={{ 
                        primaryColor: '#2196f3',
                        secondaryColor: '#21cbf3',
                        accentColor: '#f50057',
                        borderRadius: '16px',
                        title: 'Speech Recognition & Emotion Analysis',
                        showEmotions: true,
                        showTranscriptions: true,
                        showSoundAlerts: false
                      }}
                    />
                  </MotionPaper>
                </Grid>
              </Grid>
            </MotionBox>
          )}
          
          {/* Spatial Audio Tab */}
          {activeTab === 2 && (
            <MotionBox
              component={motion.div}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <MotionPaper 
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  borderRadius: 4,
                  background: 'linear-gradient(120deg, #7b1fa2 0%, #9c27b0 100%)',
                  color: 'white',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <MotionBox
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <MotionTypography 
                      variant="h3" 
                      gutterBottom 
                      fontWeight="bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      Spatial Audio
                    </MotionTypography>
                    <MotionTypography 
                      variant="h5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Locate Important Sounds in Your Environment
                    </MotionTypography>
                    <MotionTypography 
                      variant="body1" 
                      sx={{ mt: 2 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      Our spatial audio detection helps you identify important sounds in your surroundings and their direction.
                      This provides awareness of critical sounds like alarms, doorbells, approaching vehicles, and more,
                      enhancing safety and situational awareness.
                    </MotionTypography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <MotionBox
                      component={motion.div}
                      animate={{
                        scale: [1, 1.05, 1],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }
                      }}
                    >
                      <SurroundSoundIcon sx={{ 
                        fontSize: 160, 
                        opacity: 0.9,
                        filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
                      }} />
                    </MotionBox>
                  </Grid>
                </Grid>
              </MotionPaper>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
              elevation={3} 
              sx={{ 
                p: 3, 
                      height: '100%',
                borderRadius: 2, 
                background: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                      color: darkMode ? 'white' : 'inherit',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    whileHover={{ y: -5, boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)" }}
                  >
                    <MotionBox
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: 'linear-gradient(90deg, #9c27b0, #d500f9)'
                      }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                    
              <Typography variant="h5" gutterBottom>
                      <VolumeUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Sound Classification
              </Typography>
              <Typography variant="body1" paragraph>
                      Our AI can identify different types of sounds around you, alerting you to important audio events.
              </Typography>
              
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Categories of Sounds:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" label="Critical" color="error" />
                          <Typography variant="body2">Alarms, sirens, car horns</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" label="Important" color="warning" />
                          <Typography variant="body2">Doorbell, phone ringing, name calling</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip size="small" label="Informational" color="info" />
                          <Typography variant="body2">Appliances, vehicles, animals</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </MotionPaper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
              elevation={3} 
              sx={{ 
                p: 3, 
                      height: '100%',
                borderRadius: 2, 
                background: darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                      color: darkMode ? 'white' : 'inherit',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    whileHover={{ y: -5, boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)" }}
                  >
                    <MotionBox
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '5px',
                        background: 'linear-gradient(90deg, #00bcd4, #1de9b6)'
                      }}
                      initial={{ scaleX: 0, transformOrigin: 'left' }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                    
              <Typography variant="h5" gutterBottom>
                <SurroundSoundIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Direction Indication
                    </Typography>
                    <Typography variant="body1" paragraph>
                      Using multiple microphones, we can determine where sounds are coming from and alert you to their direction.
              </Typography>
              <Typography variant="body1" paragraph>
                      The direction indicator shows you precisely where sounds originate, helping you orient toward important audio events.
                    </Typography>
                    
                    <Box 
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        mt: 2
                      }}
                    >
                      <AccessibilityNewIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                        Enhancing spatial awareness for deaf and hard-of-hearing users
              </Typography>
                    </Box>
                  </MotionPaper>
                </Grid>
                
                <Grid item xs={12}>
                  <MotionPaper
                    component={motion.div}
                    variants={itemVariants}
                    elevation={3}
                    sx={{ 
                      borderRadius: 2,
                      overflow: 'hidden',
                      background: 'transparent'
                    }}
                  >
                    <AudioVisualization 
                      mode="spatial" 
                      onEmotionDetected={handleEmotionalStateUpdate}
                      visualStyle={{ 
                        primaryColor: '#9c27b0',
                        secondaryColor: '#d500f9',
                        accentColor: '#00bcd4',
                        borderRadius: '16px',
                        title: 'Sound Detection & Direction Analysis',
                        showEmotions: false,
                        showTranscriptions: false,
                        showSoundAlerts: true,
                        showDirectionIndicator: true
                      }}
                    />
                  </MotionPaper>
                </Grid>
              </Grid>
            </MotionBox>
          )}
          
          {/* Chat Tab */}
          {activeTab === 3 && (
            // Chat Interface
            <MotionBox
              component={motion.div}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <MotionPaper 
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  borderRadius: 4,
                  background: 'linear-gradient(120deg, #ff5722 0%, #ff9800 100%)',
                  color: 'white',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <MotionBox
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <MotionTypography 
                      variant="h3" 
                      gutterBottom 
                      fontWeight="bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      AI Assistant Chat
                    </MotionTypography>
                    <MotionTypography 
                      variant="h5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Get Support & Ask Questions About Audio
                    </MotionTypography>
                    <MotionTypography 
                      variant="body1" 
                      sx={{ mt: 2 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      Chat with our intelligent assistant to get help with EchoLens features, learn more about
                      audio accessibility, or get recommendations for assistive technology. The assistant can
                      also explain detected sounds and emotions in more detail.
                    </MotionTypography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <MotionBox
                      component={motion.div}
                      animate={{
                        scale: [1, 1.05, 1],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }
                      }}
                    >
                      <ChatIcon sx={{ 
                        fontSize: 160, 
                        opacity: 0.9,
                        filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
                      }} />
                    </MotionBox>
                  </Grid>
                </Grid>
              </MotionPaper>
              
              <ChatInterface 
                darkMode={darkMode} 
                emotionalState={emotionalState}
              />
            </MotionBox>
          )}
          
          {/* Multimodal Analysis Tab */}
          {activeTab === 4 && (
            <MotionBox
              component={motion.div}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <MotionPaper 
                component={motion.div}
                variants={itemVariants}
                elevation={0}
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  borderRadius: 4,
                  background: 'linear-gradient(120deg, #ff5722 0%, #ff9800 100%)',
                  color: 'white',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <MotionBox
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: -100,
                    right: -100,
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                  animate={{
                    x: [0, 10, 0],
                    y: [0, 15, 0],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                />
                
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <MotionTypography 
                      variant="h3" 
                      gutterBottom 
                      fontWeight="bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      Multimodal Analysis
                    </MotionTypography>
                    <MotionTypography 
                      variant="h5"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      Analyze Audio and Video
                    </MotionTypography>
                    <MotionTypography 
                      variant="body1" 
                      sx={{ mt: 2 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      Combine audio and video analysis to gain a more comprehensive understanding of your environment.
                    </MotionTypography>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                    <MotionBox
                      component={motion.div}
                      animate={{
                        scale: [1, 1.05, 1],
                        transition: { 
                          duration: 2, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }
                      }}
                    >
                      <VideocamIcon sx={{ 
                        fontSize: 160, 
                        opacity: 0.9,
                        filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
                      }} />
                    </MotionBox>
                  </Grid>
                </Grid>
              </MotionPaper>
              
              <MultimodalAnalysis 
                darkMode={darkMode}
              />
            </MotionBox>
          )}
        </MainContainer>
      </Box>
    </>
  );
};

export default EchoLensUI; 