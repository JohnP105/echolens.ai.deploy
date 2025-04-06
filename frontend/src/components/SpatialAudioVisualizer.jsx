import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import AudioVisualization from './AudioVisualization';
import SurroundSoundIcon from '@mui/icons-material/SurroundSound';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import RadarIcon from '@mui/icons-material/SettingsInputAntenna';

const MotionBox = motion(Box);

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

const SpatialAudioVisualizer = ({ onEmotionDetected }) => {
  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ width: '100%' }}
    >
      {/* Spatial Audio Header */}
      <Box sx={{ mb: 2, position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          background: 'linear-gradient(90deg, rgba(156,39,176,0.1) 0%, rgba(156,39,176,0) 100%)',
          borderRadius: 2,
          zIndex: 0 
        }} />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          p: 2, 
          zIndex: 1,
          position: 'relative' 
        }}>
          <SurroundSoundIcon sx={{ fontSize: 32, color: '#9c27b0' }} />
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#9c27b0' }}>
              Spatial Audio Visualizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sound classification and directional detection
            </Typography>
          </Box>
        </Box>
      </Box>
      
      {/* Feature icons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        mb: 2,
        gap: 4
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          opacity: 0.7
        }}>
          <VolumeUpIcon sx={{ fontSize: 32, mb: 1, color: '#9c27b0' }} />
          <Typography variant="caption">Sound Classification</Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          opacity: 0.7
        }}>
          <RadarIcon sx={{ fontSize: 32, mb: 1, color: '#9c27b0' }} />
          <Typography variant="caption">Direction Detection</Typography>
        </Box>
      </Box>
      
      {/* Sound Radar Visualization - Decorative */}
      <Box 
        sx={{ 
          width: '100%', 
          height: '4px', 
          background: 'linear-gradient(90deg, rgba(156,39,176,0.7) 0%, rgba(156,39,176,0) 100%)',
          borderRadius: 2,
          mb: 2
        }} 
      />
      
      {/* Main Audio Visualization with Spatial mode */}
      <AudioVisualization 
        mode="spatial" 
        onEmotionDetected={onEmotionDetected}
      />
    </MotionBox>
  );
};

export default SpatialAudioVisualizer; 