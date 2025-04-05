import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Container,
  Grid,
  IconButton,
  Tooltip,
  Avatar,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  useTheme,
  alpha,
  Slider,
  Switch,
  FormControlLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import HearingIcon from '@mui/icons-material/Hearing';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import API from '../utils/API';

// Motion components
const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionIconButton = motion(IconButton);
const MotionTypography = motion(Typography);
const MotionContainer = motion(Container);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  },
  exit: { opacity: 0, transition: { duration: 0.3 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: 'spring', stiffness: 50 }
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 1.5, repeat: Infinity }
};

// Emotion color mapping
const emotionColors = {
  happy: '#4CAF50',
  excited: '#8BC34A',
  sad: '#2196F3',
  angry: '#F44336',
  frustrated: '#FF9800',
  confused: '#9C27B0',
  neutral: '#9E9E9E',
  sarcastic: '#FF5722',
  concerned: '#607D8B',
  surprised: '#00BCD4'
};

// Mock data for transcription
const mockTranscriptions = [
  { id: 1, text: "I'm really excited about this project!", emotion: "excited", timestamp: new Date() },
  { id: 2, text: "Let me know if you need any help with the implementation.", emotion: "neutral", timestamp: new Date() },
  { id: 3, text: "This isn't working as expected.", emotion: "frustrated", timestamp: new Date() },
  { id: 4, text: "Great job on the presentation yesterday!", emotion: "happy", timestamp: new Date() },
];

// Mock data for sound alerts
const mockSoundAlerts = [
  { id: 1, soundType: "doorbell", description: "Doorbell (front door)", direction: "east", distance: "10ft", timestamp: new Date(), priority: "high" },
  { id: 2, soundType: "alarm", description: "Phone ringing (bedroom)", direction: "west", distance: "15ft", timestamp: new Date(), priority: "medium" },
  { id: 3, soundType: "footsteps", description: "Footsteps approaching (behind you)", direction: "south", distance: "6ft", timestamp: new Date(), priority: "low" },
  { id: 4, soundType: "appliance", description: "Microwave beep (kitchen)", direction: "north", distance: "20ft", timestamp: new Date(), priority: "medium" },
];

// Sound type icons
const getSoundIcon = (soundType) => {
  switch(soundType) {
    case 'doorbell': return <NotificationsIcon />;
    case 'alarm': return <ErrorIcon />;
    case 'footsteps': return <RecordVoiceOverIcon />;
    case 'appliance': return <VolumeUpIcon />;
    default: return <HearingIcon />;
  }
};

// Priority level colors
const getPriorityColor = (priority) => {
  switch(priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'default';
  }
};

// Format time for timestamps
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const EchoLensInterface = ({ darkMode }) => {
  const theme = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [soundAlerts, setSoundAlerts] = useState([]);
  const [settings, setSettings] = useState({
    transcriptionEnabled: true,
    soundDetectionEnabled: true,
    emotionDetectionEnabled: true,
    directionalAudio: true,
    notificationVolume: 70,
    distanceReporting: true
  });
  const [apiStatus, setApiStatus] = useState({ status: 'checking', gemini_api: 'checking', mongodb: 'checking' });
  const [loading, setLoading] = useState({ 
    transcriptions: false, 
    soundAlerts: false, 
    preferences: false 
  });
  const [error, setError] = useState(null);
  
  // Refs
  const transcriptionEndRef = useRef(null);
  const alertsEndRef = useRef(null);
  
  // Polling intervals
  const statusCheckInterval = useRef(null);
  const dataPollingInterval = useRef(null);
  
  // Fetch initial data and set up polling
  useEffect(() => {
    // Check API status
    const checkApiStatus = async () => {
      try {
        console.log('Checking API status...');
        const status = await API.getStatus();
        console.log('API status:', status);
        setApiStatus(status);
      } catch (error) {
        console.error('Error checking API status:', error);
        setApiStatus({ status: 'offline', error: error.message });
        
        // Show error in UI
        setError(`API Connection Error: ${error.message}. Check console for details.`);
      }
    };
    
    // Fetch user preferences
    const fetchUserPreferences = async () => {
      try {
        setLoading(prev => ({ ...prev, preferences: true }));
        console.log('Fetching user preferences...');
        const preferences = await API.getPreferences();
        console.log('User preferences:', preferences);
        
        // Only update settings that are present in our local state
        const updatedSettings = { ...settings };
        
        for (const key in updatedSettings) {
          if (key in preferences) {
            updatedSettings[key] = preferences[key];
          }
        }
        
        setSettings(updatedSettings);
      } catch (error) {
        console.error('Error fetching user preferences:', error);
        setError('Failed to load user preferences');
      } finally {
        setLoading(prev => ({ ...prev, preferences: false }));
      }
    };
    
    // Fetch latest data
    const fetchLatestData = async () => {
      try {
        // Fetch latest transcriptions
        setLoading(prev => ({ ...prev, transcriptions: true }));
        console.log('Fetching transcriptions...');
        const transcriptionsData = await API.getTranscriptions(1, 10);
        console.log('Transcriptions:', transcriptionsData);
        setTranscriptions(transcriptionsData.transcriptions || []);
        
        // Fetch latest sound alerts
        setLoading(prev => ({ ...prev, soundAlerts: true }));
        console.log('Fetching sound alerts...');
        const soundAlertsData = await API.getSoundAlerts(1, 10);
        console.log('Sound alerts:', soundAlertsData);
        setSoundAlerts(soundAlertsData.soundAlerts || []);
        
      } catch (error) {
        console.error('Error fetching latest data:', error);
        setError('Failed to load latest data: ' + error.message);
      } finally {
        setLoading(prev => ({ 
          ...prev, 
          transcriptions: false, 
          soundAlerts: false 
        }));
      }
    };
    
    // Initial data fetch
    checkApiStatus();
    fetchUserPreferences();
    fetchLatestData();
    
    // Set up polling intervals
    statusCheckInterval.current = setInterval(checkApiStatus, 10000); // Every 10 seconds
    dataPollingInterval.current = setInterval(fetchLatestData, 3000); // Every 3 seconds
    
    // Cleanup intervals on unmount
    return () => {
      clearInterval(statusCheckInterval.current);
      clearInterval(dataPollingInterval.current);
    };
  }, []);
  
  // Only start/stop polling data when listening state changes
  useEffect(() => {
    if (isListening) {
      // When listening, data polling should already be active
      if (!dataPollingInterval.current) {
        dataPollingInterval.current = setInterval(async () => {
          try {
            // Fetch latest transcriptions
            const transcriptionsData = await API.getTranscriptions(1, 10);
            setTranscriptions(transcriptionsData.transcriptions);
            
            // Fetch latest sound alerts
            const soundAlertsData = await API.getSoundAlerts(1, 10);
            setSoundAlerts(soundAlertsData.soundAlerts);
          } catch (error) {
            console.error('Error polling data:', error);
          }
        }, 3000);
      }
    } else {
      // When not listening, we can stop polling to save resources
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
        dataPollingInterval.current = null;
      }
    }
    
    // Cleanup on unmount
    return () => {
      if (dataPollingInterval.current) {
        clearInterval(dataPollingInterval.current);
      }
    };
  }, [isListening]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (transcriptionEndRef.current) {
      transcriptionEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptions]);
  
  useEffect(() => {
    if (alertsEndRef.current) {
      alertsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [soundAlerts]);

  // Toggle listening state
  const toggleListening = async () => {
    try {
      // If turning on listening, check API status first
      if (!isListening) {
        const status = await API.getStatus();
        setApiStatus(status);
        
        if (status.status !== 'online') {
          setError('Cannot start listening: API is offline');
          return;
        }
      }
      
      setIsListening(!isListening);
      
      // If we're now listening, analyze sample audio
      if (!isListening) {
        try {
          await API.analyzeAudio();
        } catch (error) {
          console.error('Error analyzing audio sample:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling listening state:', error);
      setError('Failed to connect to the API');
    }
  };

  // Update settings
  const handleSettingChange = async (setting, value) => {
    try {
      // Update local state first for immediate UI feedback
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
      
      // Then update on the server
      await API.updatePreferences({
        ...settings,
        [setting]: value
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to save settings');
      
      // Revert the change if server update failed
      setSettings(prev => ({
        ...prev,
        [setting]: !value
      }));
    }
  };

  // Audio visualization canvas effect
  useEffect(() => {
    if (!isListening) return;

    const canvas = document.getElementById('audioVisualizer');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    
    const visualize = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set up for circular visualization
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;
      
      // Draw background circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = theme.palette.mode === 'dark' 
        ? alpha(theme.palette.primary.main, 0.1)
        : alpha(theme.palette.primary.main, 0.05);
      ctx.fill();
      
      // Number of data points
      const numPoints = 180;
      
      // Generate fake audio data for demo
      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * 2 * Math.PI;
        
        // Generate random amplitude that changes over time for demo
        const time = Date.now() / 1000;
        const amplitude = 0.3 + 0.7 * Math.sin(i * 0.2 + time) * Math.sin(i * 0.13 + time * 0.7) * Math.sin(time * 0.1);
        
        // Calculate point position
        const pointRadius = radius * (0.6 + amplitude * 0.4);
        const x = centerX + pointRadius * Math.cos(angle);
        const y = centerY + pointRadius * Math.sin(angle);
        
        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        
        // Color based on position (creating a gradient effect)
        const hue = (i / numPoints) * 360;
        const colorIntensity = 50 + amplitude * 50;
        ctx.fillStyle = `hsl(${hue}, ${colorIntensity}%, 60%)`;
        ctx.fill();
      }
      
      // Draw inner circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.58, 0, 2 * Math.PI);
      ctx.fillStyle = theme.palette.background.paper;
      ctx.fill();
      
      // Draw pulse effect
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.55, 0, 2 * Math.PI);
      ctx.lineWidth = 2;
      ctx.strokeStyle = theme.palette.primary.main;
      ctx.stroke();
      
      animationFrame = requestAnimationFrame(visualize);
    };
    
    visualize();
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isListening, theme]);

  return (
    <MotionContainer 
      maxWidth="xl"
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      sx={{ 
        py: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Debug error message */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => setError(null)}
        >
          <Typography variant="body1">{error}</Typography>
          <Typography variant="caption">
            API Status: {apiStatus?.status || 'unknown'} | 
            Gemini API: {apiStatus?.gemini_api || 'unknown'} | 
            MongoDB: {apiStatus?.mongodb || 'N/A'}
          </Typography>
        </Alert>
      )}
      
      {/* Header */}
      <MotionPaper
        component={motion.div}
        variants={itemVariants}
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: '16px',
          background: 'linear-gradient(90deg, #1976d2 0%, #4fc3f7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <MotionBox
            animate={{
              rotate: [0, 10, 0, -10, 0],
              transition: { duration: 3, repeat: Infinity }
            }}
            sx={{ mr: 2 }}
          >
            <HearingIcon sx={{ fontSize: 32, color: 'white' }} />
          </MotionBox>
          <Box>
            <MotionTypography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
              EchoLens.AI
            </MotionTypography>
            <MotionTypography variant="subtitle2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Real-Time Emotion & Sound Translator
            </MotionTypography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* API Status Indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
            <Tooltip title={`API Status: ${apiStatus.status}`}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: apiStatus.status === 'online' ? 'success.main' : 
                       apiStatus.status === 'checking' ? 'warning.main' : 'error.main',
                mr: 1
              }} />
            </Tooltip>
            <Tooltip title={`Gemini AI: ${apiStatus.gemini_api}`}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: apiStatus.gemini_api === 'connected' ? 'success.main' : 
                       apiStatus.gemini_api === 'checking' ? 'warning.main' : 'error.main',
                mr: 1
              }} />
            </Tooltip>
            <Tooltip title={`MongoDB: ${apiStatus.mongodb}`}>
              <Box sx={{ 
                width: 10, 
                height: 10, 
                borderRadius: '50%', 
                bgcolor: apiStatus.mongodb === 'connected' ? 'success.main' : 
                       apiStatus.mongodb === 'checking' ? 'warning.main' : 'error.main'
              }} />
            </Tooltip>
          </Box>
          
          <Tooltip title={isListening ? "Stop Listening" : "Start Listening"}>
            <MotionIconButton
              color="inherit"
              onClick={toggleListening}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              sx={{ 
                color: 'white',
                bgcolor: isListening ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {isListening ? <MicIcon /> : <MicOffIcon />}
            </MotionIconButton>
          </Tooltip>
          
          <Tooltip title="Settings">
            <MotionIconButton
              color="inherit"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              sx={{ 
                ml: 1,
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              <SettingsIcon />
            </MotionIconButton>
          </Tooltip>
        </Box>
      </MotionPaper>
      
      {/* Main content */}
      <Grid container spacing={3} sx={{ flexGrow: 1 }}>
        {/* Central Audio Visualization */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <MotionPaper
            component={motion.div}
            variants={itemVariants}
            elevation={3}
            sx={{
              p: 3,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Audio Visualization
            </Typography>
            
            <Box 
              sx={{ 
                position: 'relative',
                width: '100%',
                height: '300px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <canvas 
                id="audioVisualizer" 
                width={300} 
                height={300} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  maxWidth: '300px', 
                  maxHeight: '300px'
                }}
              />
              
              {!isListening && (
                <Box 
                  sx={{ 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    borderRadius: '50%',
                    maxWidth: '300px', 
                    maxHeight: '300px',
                    margin: '0 auto'
                  }}
                >
                  <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                    {apiStatus.status !== 'online' 
                      ? 'API offline. Please check connection.' 
                      : 'Listening paused'}
                  </Typography>
                  <MotionIconButton
                    color="primary"
                    onClick={toggleListening}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={apiStatus.status !== 'online'}
                    sx={{ 
                      p: 2,
                      bgcolor: theme.palette.primary.main,
                      color: 'white',
                      '&:hover': {
                        bgcolor: theme.palette.primary.dark,
                      }
                    }}
                  >
                    <MicIcon sx={{ fontSize: 40 }} />
                  </MotionIconButton>
                </Box>
              )}
            </Box>
            
            <Box sx={{ mt: 3, width: '100%' }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Detection Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.transcriptionEnabled} 
                        onChange={(e) => handleSettingChange('transcriptionEnabled', e.target.checked)}
                        color="primary"
                        disabled={apiStatus.status !== 'online'}
                      />
                    }
                    label="Transcription"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.soundDetectionEnabled} 
                        onChange={(e) => handleSettingChange('soundDetectionEnabled', e.target.checked)}
                        color="primary"
                        disabled={apiStatus.status !== 'online'}
                      />
                    }
                    label="Sound Detection"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.emotionDetectionEnabled} 
                        onChange={(e) => handleSettingChange('emotionDetectionEnabled', e.target.checked)}
                        color="primary"
                        disabled={apiStatus.status !== 'online' || apiStatus.gemini_api !== 'connected'}
                      />
                    }
                    label="Emotion Detection"
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.directionalAudio} 
                        onChange={(e) => handleSettingChange('directionalAudio', e.target.checked)}
                        color="primary"
                        disabled={apiStatus.status !== 'online'}
                      />
                    }
                    label="Directional Audio"
                  />
                </Grid>
              </Grid>
            </Box>
          </MotionPaper>
        </Grid>
        
        {/* Transcription Panel */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <MotionPaper
            component={motion.div}
            variants={itemVariants}
            elevation={3}
            sx={{
              p: 3,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Speech Transcription</span>
              {loading.transcriptions && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              with emotion detection
            </Typography>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              maxHeight: 'calc(100vh - 300px)',
              pr: 1
            }}>
              {transcriptions.length === 0 ? (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  opacity: 0.7
                }}>
                  <RecordVoiceOverIcon sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                  <Typography variant="body1" color="text.secondary" align="center">
                    No transcriptions yet. Start listening and speak to see them appear here.
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence>
                  {transcriptions.map((item) => (
                    <MotionBox
                      key={item.id || item._id}
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                      sx={{ mb: 2 }}
                    >
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: '12px',
                          borderLeft: `4px solid ${emotionColors[item.emotion] || theme.palette.primary.main}`
                        }}
                      >
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {item.text}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={item.emotion} 
                            size="small"
                            sx={{ 
                              bgcolor: alpha(emotionColors[item.emotion] || theme.palette.primary.main, 0.1),
                              color: emotionColors[item.emotion] || theme.palette.primary.main,
                              fontWeight: 500
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(item.timestamp)}
                          </Typography>
                        </Box>
                      </Paper>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              )}
              <div ref={transcriptionEndRef} />
            </Box>
          </MotionPaper>
        </Grid>
        
        {/* Sound Alerts Panel */}
        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <MotionPaper
            component={motion.div}
            variants={itemVariants}
            elevation={3}
            sx={{
              p: 3,
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Environmental Sound Alerts</span>
              {loading.soundAlerts && (
                <CircularProgress size={20} sx={{ ml: 1 }} />
              )}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              with spatial awareness
            </Typography>
            
            <Box sx={{ 
              flexGrow: 1, 
              overflow: 'auto', 
              maxHeight: 'calc(100vh - 300px)',
              pr: 1
            }}>
              {soundAlerts.length === 0 ? (
                <Box sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexDirection: 'column',
                  opacity: 0.7
                }}>
                  <VolumeUpIcon sx={{ fontSize: 48, mb: 2, color: 'text.secondary' }} />
                  <Typography variant="body1" color="text.secondary" align="center">
                    No sound alerts detected yet. Start listening to detect environmental sounds.
                  </Typography>
                </Box>
              ) : (
                <AnimatePresence>
                  {soundAlerts.map((alert) => (
                    <MotionBox
                      key={alert.id || alert._id}
                      component={motion.div}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 500 }}
                      sx={{ mb: 2 }}
                    >
                      <Paper 
                        elevation={1} 
                        sx={{ 
                          p: 2, 
                          borderRadius: '12px',
                          borderLeft: `4px solid ${theme.palette[getPriorityColor(alert.priority)].main}`
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette[getPriorityColor(alert.priority)].main, 0.1),
                              color: theme.palette[getPriorityColor(alert.priority)].main,
                              width: 36, 
                              height: 36,
                              mr: 1.5
                            }}
                          >
                            {getSoundIcon(alert.soundType)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {alert.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Direction: {alert.direction} • Distance: {alert.distance}
                            </Typography>
                          </Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Chip 
                            label={alert.priority.toUpperCase()} 
                            size="small"
                            color={getPriorityColor(alert.priority)}
                            sx={{ fontWeight: 500 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(alert.timestamp)}
                          </Typography>
                        </Box>
                      </Paper>
                    </MotionBox>
                  ))}
                </AnimatePresence>
              )}
              <div ref={alertsEndRef} />
            </Box>
          </MotionPaper>
        </Grid>
      </Grid>
    </MotionContainer>
  );
};

export default EchoLensInterface; 