import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import AudioVisualization from './AudioVisualization';
import HearingIcon from '@mui/icons-material/Hearing';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MoodIcon from '@mui/icons-material/Mood';

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

const SpeechRecognitionVisualizer = ({ onEmotionDetected }) => {
  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      sx={{ width: '100%' }}
    >
      {/* Speech Recognition Header */}
      <Box sx={{ mb: 2, position: 'relative' }}>
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%',
          background: 'linear-gradient(90deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0) 100%)',
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
          <HearingIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Speech Recognition Visualizer
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time transcription and emotional analysis
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
          <RecordVoiceOverIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="caption">Voice Transcription</Typography>
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          opacity: 0.7
        }}>
          <MoodIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
          <Typography variant="caption">Emotion Analysis</Typography>
        </Box>
      </Box>
      
      {/* Main Audio Visualization with Speech mode */}
      <AudioVisualization 
        mode="speech" 
        onEmotionDetected={onEmotionDetected}
      />
    </MotionBox>
  );
};

export default SpeechRecognitionVisualizer; 