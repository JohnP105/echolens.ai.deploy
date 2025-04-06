import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme,
  Chip,
  Slider
} from '@mui/material';
import { motion } from 'framer-motion';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SurroundSoundIcon from '@mui/icons-material/SurroundSound';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import SettingsIcon from '@mui/icons-material/Settings';
import API from '../utils/API';
import { keyframes } from '@mui/system';

// Animation keyframes
const pulseAnimation = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 0.9; }
  100% { transform: scale(1); opacity: 0.7; }
`;

const rippleAnimation = keyframes`
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2); opacity: 0; }
`;

// Animation variants for framer motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
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

// Styled components with motion
const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionTypography = motion(Typography);

// Sound types with their visual representation
const soundTypes = {
  speech: { color: '#4285F4', icon: '👤', label: 'Speech' },
  dog_bark: { color: '#EA4335', icon: '🐕', label: 'Dog' },
  car_horn: { color: '#FBBC05', icon: '🚗', label: 'Car Horn' },
  siren: { color: '#34A853', icon: '🚨', label: 'Siren' },
  door_knock: { color: '#8F44AD', icon: '🚪', label: 'Door' },
  phone_ring: { color: '#F39C12', icon: '📱', label: 'Phone' },
  music: { color: '#9C27B0', icon: '🎵', label: 'Music' },
  baby_cry: { color: '#FF5722', icon: '👶', label: 'Baby' },
  footsteps: { color: '#795548', icon: '👣', label: 'Footsteps' },
  applause: { color: '#607D8B', icon: '👏', label: 'Applause' },
  unknown: { color: '#9E9E9E', icon: '❓', label: 'Unknown' }
};

// Sound Map Component
const SoundMap = ({ darkMode }) => {
  const theme = useTheme();
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [soundData, setSoundData] = useState([]);
  const [mapSize, setMapSize] = useState({ width: 600, height: 400 });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(2); // seconds
  const intervalRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Function to generate mock sound data for demo purposes
  // In a real app, this would come from backend audio processing
  const generateMockSoundData = () => {
    setLoading(true);
    // Clear previous data
    setSoundData([]);
    
    setTimeout(() => {
      const numSounds = Math.floor(Math.random() * 5) + 3; // 3-7 sounds
      const newSounds = [];
      
      // Center position represents the user/listener
      const center = { x: mapSize.width / 2, y: mapSize.height / 2 };
      
      // Generate random sounds at different positions
      for (let i = 0; i < numSounds; i++) {
        // Calculate random angle and distance
        const angle = Math.random() * 360;
        const distance = (Math.random() * 0.7 + 0.1) * (Math.min(mapSize.width, mapSize.height) / 2);
        
        // Convert polar to cartesian coordinates
        const x = center.x + distance * Math.cos(angle * Math.PI / 180);
        const y = center.y + distance * Math.sin(angle * Math.PI / 180);
        
        // Get random sound type
        const soundTypeKeys = Object.keys(soundTypes);
        const randomType = soundTypeKeys[Math.floor(Math.random() * (soundTypeKeys.length - 1))]; // Exclude "unknown"
        
        // Calculate intensity based on distance (closer = louder)
        const intensity = 1 - (distance / (Math.min(mapSize.width, mapSize.height) / 2));
        
        newSounds.push({
          id: `sound-${Date.now()}-${i}`,
          type: randomType,
          position: { x, y },
          intensity: intensity.toFixed(2),
          angle: Math.round(angle),
          timestamp: new Date().toISOString()
        });
      }
      
      setSoundData(newSounds);
      setLoading(false);
    }, 1000); // Simulate API delay
  };
  
  // Function to handle real sound data from API
  const fetchSoundMapData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call the actual API
      // const response = await API.getSoundMapData();
      // setSoundData(response.data);
      
      // For now, use mock data
      generateMockSoundData();
    } catch (error) {
      console.error("Error fetching sound map data:", error);
      setError("Failed to load sound map data");
      setLoading(false);
    }
  };
  
  // Initialize map on component mount
  useEffect(() => {
    fetchSoundMapData();
    
    // Measure the container size
    if (mapRef.current) {
      const { clientWidth, clientHeight } = mapRef.current;
      setMapSize({ width: clientWidth, height: clientHeight });
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Handle auto-refresh
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchSoundMapData();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);
  
  // Render a single sound item on the map
  const renderSoundItem = (sound) => {
    const soundType = soundTypes[sound.type] || soundTypes.unknown;
    const size = 50 + (parseFloat(sound.intensity) * 30); // Size based on intensity
    
    return (
      <MotionBox
        key={sound.id}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0 }}
        transition={{ duration: 0.5 }}
        sx={{
          position: 'absolute',
          left: sound.position.x - size/2,
          top: sound.position.y - size/2,
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${soundType.color}40`, // 40 is hex for 25% opacity
          zIndex: 10,
          filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))',
          fontSize: 16 + (parseFloat(sound.intensity) * 10),
          transform: `scale(${zoomLevel})`,
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `2px solid ${soundType.color}`,
            animation: `${pulseAnimation} ${2 - parseFloat(sound.intensity)}s infinite ease-in-out`
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: `1px solid ${soundType.color}`,
            animation: `${rippleAnimation} ${3 - parseFloat(sound.intensity)}s infinite ease-out`
          }
        }}
      >
        <Tooltip 
          title={
            <Box>
              <Typography variant="body2"><strong>{soundType.label}</strong></Typography>
              <Typography variant="caption">Intensity: {Math.round(sound.intensity * 100)}%</Typography>
              <Typography variant="caption">Direction: {sound.angle}°</Typography>
            </Box>
          }
        >
          <Box sx={{ fontSize: 'inherit' }}>
            {soundType.icon}
          </Box>
        </Tooltip>
      </MotionBox>
    );
  };
  
  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <MotionTypography
        component={motion.div}
        variants={itemVariants}
        variant="h4"
        gutterBottom
        sx={{ 
          mb: 4, 
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          color: darkMode ? '#FFFFFF' : '#212121'
        }}
      >
        <MapIcon sx={{ fontSize: 36 }} />
        Sound Map
        <Box
          sx={{
            height: '4px',
            width: '60px',
            ml: 2,
            borderRadius: '4px',
            background: 'linear-gradient(90deg, #2196f3, #21cbf3)'
          }}
        />
      </MotionTypography>
      
      <MotionBox
        component={motion.div}
        variants={itemVariants}
      >
        <Typography variant="body1" paragraph>
          Sound Map visualizes your audio environment by placing sound sources in a spatial representation. 
          It helps deaf and hard-of-hearing users understand where sounds are coming from and what types of sounds are present.
        </Typography>
      </MotionBox>
      
      {/* Controls */}
      <MotionBox
        component={motion.div}
        variants={itemVariants}
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
      >
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={fetchSoundMapData}
            disabled={loading}
            sx={{ mr: 2 }}
          >
            Refresh Map
          </Button>
          
          <Button
            variant="outlined"
            color="primary"
            startIcon={autoRefresh ? <SettingsIcon /> : <SettingsIcon />}
            onClick={() => setAutoRefresh(!autoRefresh)}
            sx={{ mr: 2 }}
          >
            {autoRefresh ? "Stop Auto-refresh" : "Auto-refresh"}
          </Button>
          
          {autoRefresh && (
            <Box sx={{ width: 200, display: 'inline-flex', alignItems: 'center', ml: 2 }}>
              <Typography variant="body2" sx={{ mr: 2, minWidth: 80 }}>
                Every {refreshInterval}s
              </Typography>
              <Slider
                value={refreshInterval}
                min={1}
                max={10}
                step={1}
                onChange={(e, newValue) => setRefreshInterval(newValue)}
                valueLabelDisplay="auto"
                size="small"
              />
            </Box>
          )}
        </Box>
        
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>Zoom: {zoomLevel.toFixed(1)}x</Typography>
          <Slider
            value={zoomLevel}
            min={0.5}
            max={2}
            step={0.1}
            onChange={(e, newValue) => setZoomLevel(newValue)}
            valueLabelDisplay="auto"
            sx={{ width: 120 }}
            size="small"
          />
        </Box>
      </MotionBox>
      
      {/* Sound Map */}
      <MotionPaper
        component={motion.div}
        variants={itemVariants}
        elevation={3}
        sx={{ 
          p: 0,
          borderRadius: 4,
          overflow: 'hidden',
          height: 500,
          position: 'relative',
          background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }}
      >
        {/* Map content */}
        <Box 
          ref={mapRef}
          sx={{ 
            height: '100%', 
            width: '100%', 
            position: 'relative',
            backgroundImage: `radial-gradient(circle, ${darkMode ? 'rgba(255,255,255,0.05) 1px, transparent 1px' : 'rgba(0,0,0,0.05) 1px, transparent 1px'})`,
            backgroundSize: '20px 20px',
          }}
        >
          {/* Center indicator (you/listener) */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
              border: '2px dashed',
              borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 5,
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '90%',
                height: '90%',
                borderRadius: '50%',
                border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                width: '150%',
                height: '150%',
                borderRadius: '50%',
                border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`,
              }
            }}
          >
            <Typography variant="body2" sx={{ color: darkMode ? '#FFFFFF' : '#000000' }}>
              YOU
            </Typography>
          </Box>
          
          {/* Render sound items */}
          {soundData.map(sound => renderSoundItem(sound))}
          
          {/* Loading overlay */}
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.3)',
                zIndex: 20,
                backdropFilter: 'blur(3px)'
              }}
            >
              <CircularProgress />
            </Box>
          )}
          
          {/* Error message */}
          {error && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(244, 67, 54, 0.2)',
                backdropFilter: 'blur(5px)',
                padding: 3,
                borderRadius: 2,
                border: '1px solid rgba(244, 67, 54, 0.5)',
                zIndex: 20
              }}
            >
              <Typography variant="body1" color="error">
                {error}
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={fetchSoundMapData} 
                sx={{ mt: 2 }}
              >
                Try Again
              </Button>
            </Box>
          )}
        </Box>
      </MotionPaper>
      
      {/* Sound type legend */}
      <MotionPaper
        component={motion.div}
        variants={itemVariants}
        elevation={2}
        sx={{ 
          mt: 2,
          p: 2,
          borderRadius: 2,
          background: darkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Sound Types
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(soundTypes).map(([key, type]) => (
            key !== 'unknown' && (
              <Chip
                key={key}
                label={type.label}
                icon={<Box component="span" sx={{ fontSize: '16px', mr: 1 }}>{type.icon}</Box>}
                sx={{ 
                  backgroundColor: `${type.color}20`,
                  color: darkMode ? '#FFFFFF' : '#000000',
                  border: `1px solid ${type.color}`,
                  '& .MuiChip-icon': {
                    color: 'inherit'
                  }
                }}
              />
            )
          ))}
        </Box>
      </MotionPaper>
    </MotionBox>
  );
};

export default SoundMap; 