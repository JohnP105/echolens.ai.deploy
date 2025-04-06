import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Grid, 
  Alert, 
  CircularProgress, 
  Chip,
  Switch,
  FormControlLabel,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import { motion } from 'framer-motion';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import HearingIcon from '@mui/icons-material/Hearing';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import API from '../utils/API';
import { keyframes } from '@mui/system';
import { API_BASE_URL } from '../config';

// Animation variants
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

// Pulse animation for Gemini badge
const pulseBadge = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.7); }
  70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(33, 150, 243, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(33, 150, 243, 0); }
`;

// Create motion components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);

const MultimodalAnalysis = ({ darkMode }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraImage, setCameraImage] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [soundClasses, setSoundClasses] = useState([]);
  const [directionData, setDirectionData] = useState({});
  const [emotionData, setEmotionData] = useState({});

  // Initialize camera
  useEffect(() => {
    // Only handle cleanup when unmounting
    return () => {
      // Stop camera when component unmounts
      if (cameraActive) {
        handleStopCamera();
      }
    };
  }, [cameraActive]);

  // Start camera
  const handleStartCamera = async () => {
    try {
      setCameraLoading(true);
      setError(null);
      const response = await API.startCamera();
      if (response.status === "success") {
        setCameraActive(true);
        // No need to get snapshot since we're streaming
      } else {
        setError("Failed to start camera: " + response.message);
      }
    } catch (error) {
      setError("Error starting camera: " + error.message);
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop camera
  const handleStopCamera = async () => {
    try {
      setCameraLoading(true);
      const response = await API.stopCamera();
      
      // Always reset the UI state regardless of API response
      setCameraActive(false);
      setCameraImage(null);
      
      if (response.status !== "success") {
        console.error("Warning: API reported failure to stop camera:", response.message);
      }
    } catch (error) {
      console.error("Error stopping camera:", error);
      // Still reset UI state even if API call fails
      setCameraActive(false);
      setCameraImage(null);
      setError("Error stopping camera, but deactivated on interface. Please refresh the page if problems persist.");
    } finally {
      setCameraLoading(false);
    }
  };

  // Get latest camera snapshot
  const getLatestSnapshot = async () => {
    try {
      const response = await API.getCameraSnapshot();
      if (response.status === "success") {
        setCameraImage(response.image);
      } else {
        console.error("Failed to get camera snapshot:", response.message);
      }
    } catch (error) {
      console.error("Error getting camera snapshot:", error);
    }
  };

  // Analyze environment with Gemini
  const handleAnalyzeEnvironment = async () => {
    try {
      setAnalysisLoading(true);
      setError(null);
      
      // Prepare data for analysis
      const data = {
        transcription: transcription,
        sounds: soundClasses,
        direction: directionData,
        emotion: emotionData
      };
      
      // Call API for multimodal analysis
      const response = await API.analyzeEnvironment(data);
      setAnalysisResult(response);
    } catch (error) {
      setError("Error analyzing environment: " + error.message);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Handle manual input changes for testing
  const handleTranscriptionChange = (e) => {
    setTranscription(e.target.value);
  };

  // Format analysis result for display
  const formatAnalysisResult = (result) => {
    if (!result || !result.analysis) return null;
    
    // Split analysis into paragraphs
    const paragraphs = result.analysis.split('\n').filter(p => p.trim() !== '');
    
    return (
      <Box>
        {paragraphs.map((p, index) => (
          <Typography key={index} paragraph sx={{ mb: 1 }}>
            {p}
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <MotionPaper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: 2,
          background: darkMode 
            ? 'linear-gradient(135deg, rgba(13, 37, 63, 0.9) 0%, rgba(33, 41, 89, 0.8) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(240, 242, 245, 0.8) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <MotionTypography 
            component={motion.div}
            variants={itemVariants}
            variant="h5" 
            gutterBottom
            sx={{
              fontWeight: 'bold',
              borderBottom: '2px solid rgba(33, 150, 243, 0.5)',
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideocamIcon sx={{ mr: 1, color: '#2196f3' }} />
              Multimodal Analysis
            </Box>
            
            <Chip 
              label="Powered by Gemini" 
              color="primary"
              size="small"
              sx={{ 
                animation: `${pulseBadge} 2s infinite`,
                fontWeight: 'bold',
                background: 'linear-gradient(90deg, #2196f3, #21cbf3)'
              }}
            />
          </MotionTypography>
          
          <MotionBox
            component={motion.div}
            variants={itemVariants}
          >
            <Typography variant="body1" paragraph>
              EchoLens.AI showcases Gemini's multimodal capabilities by analyzing both visual and audio information to provide comprehensive environmental understanding for deaf and hard of hearing users.
            </Typography>
          </MotionBox>
          
          <Grid container spacing={3}>
            {/* Left column - Camera + controls */}
            <Grid item xs={12} md={6}>
              <MotionBox
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                  Visual Input
                </Typography>
                
                <Box sx={{ 
                  height: 300, 
                  border: '1px solid',
                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  mb: 2,
                  position: 'relative',
                  backgroundColor: 'rgba(0,0,0,0.2)'
                }}>
                  {cameraActive ? (
                    // Use MJPEG streaming for smoother video
                    <iframe
                      src={`${API_BASE_URL}/camera/stream`}
                      title="Camera stream"
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        border: 'none',
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      flexDirection: 'column'
                    }}>
                      <CameraAltIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                      <Typography variant="body2" color="textSecondary">
                        Camera is inactive
                      </Typography>
                    </Box>
                  )}
                  
                  {cameraLoading && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(0,0,0,0.5)'
                    }}>
                      <CircularProgress />
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Button
                    variant="contained"
                    color={cameraActive ? "error" : "primary"}
                    startIcon={cameraActive ? <VideocamOffIcon /> : <VideocamIcon />}
                    onClick={cameraActive ? handleStopCamera : handleStartCamera}
                    disabled={cameraLoading}
                    sx={{ 
                      fontWeight: 'bold',
                      ...(cameraActive && {
                        animation: `${pulseBadge} 2s infinite`,
                        px: 3,
                        py: 1
                      })
                    }}
                  >
                    {cameraActive ? "STOP CAMERA" : "Start Camera"}
                  </Button>
                  
                  {cameraActive && (
                    <Box>
                      <Chip
                        label="Live Streaming"
                        color="success"
                        size="small"
                        icon={<VideocamIcon fontSize="small" />}
                        sx={{ animation: `${pulseBadge} 2s infinite` }}
                      />
                    </Box>
                  )}
                </Box>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
              </MotionBox>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Audio data inputs (for testing) */}
              <MotionBox
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#f50057', fontWeight: 'bold' }}>
                  Audio Context (Test Inputs)
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Transcription:
                  </Typography>
                  <textarea
                    value={transcription}
                    onChange={handleTranscriptionChange}
                    style={{ 
                      width: '100%', 
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid ' + (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                      background: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.7)',
                      color: darkMode ? '#FFFFFF' : 'black',
                      minHeight: '80px'
                    }}
                    placeholder="Enter sample transcription here..."
                  />
                </Box>
                
                {/* Add some sample sounds for testing */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Sample Sounds:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[
                      { label: "Dog barking", score: 0.82 },
                      { label: "Car horn", score: 0.65 },
                      { label: "Speech", score: 0.93 }
                    ].map((sound, index) => (
                      <Chip
                        key={index}
                        label={`${sound.label} (${Math.round(sound.score * 100)}%)`}
                        onClick={() => setSoundClasses(prev => [...prev, sound])}
                        color="secondary"
                        sx={{ mb: 1 }}
                      />
                    ))}
                  </Box>
                </Box>
                
                {/* Show active sounds */}
                {soundClasses.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Active Sounds:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {soundClasses.map((sound, index) => (
                        <Chip
                          key={index}
                          label={`${sound.label} (${Math.round(sound.score * 100)}%)`}
                          onDelete={() => setSoundClasses(prev => prev.filter((_, i) => i !== index))}
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => setSoundClasses([])}
                  disabled={soundClasses.length === 0}
                  sx={{ mr: 2 }}
                >
                  Clear Sounds
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    setDirectionData({ direction: "left", angle: 270, confidence: 0.75 });
                    setEmotionData({ emotion: "happy", confidence: 0.65, intensity: 0.7 });
                  }}
                >
                  Add Sample Context
                </Button>
              </MotionBox>
            </Grid>
            
            {/* Right column - Analysis results */}
            <Grid item xs={12} md={6}>
              <MotionBox
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                  Multimodal Analysis Result
                </Typography>
                
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleAnalyzeEnvironment}
                  disabled={analysisLoading || (!cameraImage && soundClasses.length === 0 && !transcription)}
                  sx={{ mb: 3 }}
                >
                  {analysisLoading ? (
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  ) : (
                    <SettingsVoiceIcon sx={{ mr: 1 }} />
                  )}
                  Analyze Environment with Gemini
                </Button>
                
                <MotionPaper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    height: 400,
                    overflow: 'auto',
                    backgroundColor: darkMode ? 'rgba(13, 37, 63, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                    border: '1px solid',
                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                  }}
                >
                  {analysisLoading ? (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <CircularProgress sx={{ mb: 2 }} />
                      <Typography variant="body2" color="textSecondary">
                        Gemini is analyzing your environment...
                      </Typography>
                    </Box>
                  ) : analysisResult ? (
                    formatAnalysisResult(analysisResult)
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      textAlign: 'center',
                      px: 2
                    }}>
                      <RecordVoiceOverIcon sx={{ fontSize: 64, color: 'rgba(33, 150, 243, 0.3)', mb: 2 }} />
                      <Typography variant="body1" color="textSecondary" paragraph>
                        Click "Analyze Environment" to have Gemini provide a multimodal analysis of what's happening.
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Gemini will analyze the camera feed, audio transcription, detected sounds, and other contextual cues to provide a comprehensive understanding.
                      </Typography>
                    </Box>
                  )}
                </MotionPaper>
                
                {/* Show any context information being sent */}
                {(Object.keys(directionData).length > 0 || Object.keys(emotionData).length > 0) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Additional Context:
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.keys(directionData).length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Chip 
                            icon={<HearingIcon />}
                            label={`Sound Direction: ${directionData.direction}`}
                            color="info"
                            sx={{ width: '100%' }}
                          />
                        </Grid>
                      )}
                      {Object.keys(emotionData).length > 0 && (
                        <Grid item xs={12} sm={6}>
                          <Chip 
                            icon={<VisibilityIcon />}
                            label={`Emotion: ${emotionData.emotion}`}
                            color="secondary"
                            sx={{ width: '100%' }}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
              </MotionBox>
            </Grid>
          </Grid>
        </Box>
      </MotionPaper>
    </MotionBox>
  );
};

export default MultimodalAnalysis; 