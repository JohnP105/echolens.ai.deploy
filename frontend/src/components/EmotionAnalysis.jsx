import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Chip, 
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';

// Import icons
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const EmotionAnalysis = ({ updateEmotionalState }) => {
  const [textInput, setTextInput] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showHelp, setShowHelp] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Available emotions with their descriptions and suggestions
  const emotions = {
    happy: {
      description: "Feeling joyful, content, or pleased",
      color: "success",
      icon: <SentimentSatisfiedAltIcon />,
      intensity: "medium",
      suggestion: "Great to see you happy! This is a good time to reflect on what brings you joy and practice gratitude."
    },
    excited: {
      description: "Feeling enthusiastic and eager",
      color: "success",
      icon: <SentimentSatisfiedAltIcon />,
      intensity: "high",
      suggestion: "Channel this positive energy into activities you enjoy or creative pursuits."
    },
    calm: {
      description: "Feeling peaceful and relaxed",
      color: "info",
      icon: <SentimentNeutralIcon />,
      intensity: "low",
      suggestion: "This peaceful state is ideal for mindfulness practice and reflection."
    },
    neutral: {
      description: "Not experiencing strong emotions",
      color: "default",
      icon: <SentimentNeutralIcon />,
      intensity: "low",
      suggestion: "A neutral state can be a good time to check in with yourself and practice mindfulness."
    },
    sad: {
      description: "Feeling unhappy or down",
      color: "error",
      icon: <SentimentVeryDissatisfiedIcon />,
      intensity: "medium",
      suggestion: "It's okay to feel sad sometimes. Consider reaching out to someone you trust or engaging in a comforting activity."
    },
    anxious: {
      description: "Feeling worried or nervous",
      color: "warning",
      icon: <SentimentVeryDissatisfiedIcon />,
      intensity: "medium",
      suggestion: "Deep breathing exercises can help reduce anxiety. Try taking several slow, deep breaths."
    },
    angry: {
      description: "Feeling frustrated or irritated",
      color: "error",
      icon: <SentimentVeryDissatisfiedIcon />,
      intensity: "high",
      suggestion: "When angry, taking a moment to pause before reacting can be helpful. Consider physical activity to release tension."
    },
    tired: {
      description: "Feeling fatigued or exhausted",
      color: "warning",
      icon: <SentimentVeryDissatisfiedIcon />,
      intensity: "medium",
      suggestion: "Your body might be telling you to rest. Consider taking a break or getting some extra sleep tonight."
    },
    fear: {
      description: "Feeling afraid or scared",
      color: "error",
      icon: <SentimentVeryDissatisfiedIcon />,
      intensity: "high",
      suggestion: "Fear is a natural response to perceived threats. Try grounding techniques by focusing on what you can see, hear, and touch."
    }
  };

  // Get appropriate icon and color for emotion that might not be in our predefined list
  const getEmotionDisplay = (emotion) => {
    if (emotions[emotion]) {
      return emotions[emotion];
    }
    
    // Default values for unknown emotions
    return {
      description: "Emotion detected",
      color: "default",
      icon: <SentimentNeutralIcon />,
      intensity: "medium",
      suggestion: "Consider reflecting on this emotion and what might have triggered it."
    };
  };

  // Analyze the text input for emotions using the backend API
  const analyzeText = async () => {
    if (!textInput.trim()) return;
    
    setIsAnalyzing(true);
    setApiError(null);
    
    try {
      // Call the backend API for analysis
      const response = await fetch('http://localhost:4000/api/analyze-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Get display data for this emotion (icon, color, etc.)
      const emotionDisplay = getEmotionDisplay(data.emotion);
      
      const result = {
        emotion: data.emotion,
        sentiment: data.sentiment,
        intensity: data.intensity,
        suggestion: data.suggestion,
        ...emotionDisplay
      };
      
      setAnalysisResult(result);
      updateEmotionalState(result);
    } catch (error) {
      console.error('Error analyzing text:', error);
      setApiError('Failed to analyze emotion. Using fallback method.');
      
      // Fallback to simple keyword matching
      fallbackAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Fallback to simple keyword matching if API fails
  const fallbackAnalysis = () => {
    const text = textInput.toLowerCase();
    let detectedEmotion = "neutral";
    
    if (text.includes("happy") || text.includes("joy") || text.includes("glad") || text.includes("good") || text.includes("great")) {
      detectedEmotion = "happy";
    } else if (text.includes("excited") || text.includes("thrill") || text.includes("eager")) {
      detectedEmotion = "excited";
    } else if (text.includes("calm") || text.includes("relax") || text.includes("peace")) {
      detectedEmotion = "calm";
    } else if (text.includes("sad") || text.includes("unhappy") || text.includes("down") || text.includes("depress")) {
      detectedEmotion = "sad";
    } else if (text.includes("anxious") || text.includes("worry") || text.includes("nervous") || text.includes("stress")) {
      detectedEmotion = "anxious";
    } else if (text.includes("angry") || text.includes("mad") || text.includes("frustrat")) {
      detectedEmotion = "angry";
    } else if (text.includes("tired") || text.includes("exhaust") || text.includes("sleep") || text.includes("fatigue")) {
      detectedEmotion = "tired";
    }
    
    const result = {
      emotion: detectedEmotion,
      sentiment: detectedEmotion === "happy" || detectedEmotion === "excited" || detectedEmotion === "calm" ? "positive" : "negative",
      intensity: detectedEmotion === "excited" || detectedEmotion === "angry" ? "high" : "medium",
      ...emotions[detectedEmotion]
    };
    
    setAnalysisResult(result);
    updateEmotionalState(result);
  };

  // Handle manual emotion selection
  const handleEmotionSelect = (event) => {
    const emotion = event.target.value;
    setSelectedEmotion(emotion);
    
    if (emotion) {
      const result = {
        emotion: emotion,
        confidence: 1.0,
        sentiment: emotion === "happy" || emotion === "excited" || emotion === "calm" ? "positive" : "negative",
        intensity: emotion === "excited" || emotion === "angry" ? "high" : "medium",
        ...emotions[emotion]
      };
      
      setAnalysisResult(result);
      updateEmotionalState(result);
    }
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom align="center">
        Emotion Analysis
      </Typography>
      
      <Grid container spacing={3}>
        {/* Text input analysis */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Text Analysis</Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Describe how you're feeling, and I'll analyze the emotional content.
            </Typography>
            
            <TextField
              label="How are you feeling today?"
              multiline
              rows={4}
              fullWidth
              variant="outlined"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="For example: I'm feeling quite stressed about my upcoming presentation, but also excited to share my ideas."
            />
            
            <Button
              variant="contained"
              color="primary"
              onClick={analyzeText}
              disabled={!textInput.trim() || isAnalyzing}
              sx={{ alignSelf: 'flex-start' }}
              startIcon={isAnalyzing ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
            
            {apiError && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {apiError}
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Manual emotion selection */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SentimentNeutralIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5">Select Your Emotion</Typography>
            </Box>
            
            <Typography variant="body1" sx={{ mb: 2 }}>
              Alternatively, you can directly select how you're feeling from the list.
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>I'm feeling...</InputLabel>
              <Select
                value={selectedEmotion}
                label="I'm feeling..."
                onChange={handleEmotionSelect}
              >
                {Object.entries(emotions).map(([key, data]) => (
                  <MenuItem value={key} key={key}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {data.icon}
                      <Typography sx={{ ml: 1 }}>
                        {key.charAt(0).toUpperCase() + key.slice(1)} - {data.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setShowHelp(!showHelp)}
                startIcon={<HelpOutlineIcon />}
              >
                {showHelp ? 'Hide Help' : 'Show Help'}
              </Button>
            </Box>
            
            {showHelp && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>How to use:</strong> Either describe how you're feeling in the text box and click "Analyze",
                  or directly select your emotion from the dropdown menu. The analysis results will help inform
                  the RoboMind AI on how to best support you.
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>
        
        {analysisResult && (
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: `${analysisResult.color}.main`,
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" gutterBottom>
                Emotion Analysis Results
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                  {analysisResult.icon}
                </Box>
                <Typography variant="h4">
                  {analysisResult.emotion.charAt(0).toUpperCase() + analysisResult.emotion.slice(1)}
                </Typography>
              </Box>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 3 }}>
                <Chip 
                  label={`Intensity: ${analysisResult.intensity}`}
                  color={analysisResult.intensity === 'high' ? 'warning' : 'primary'}
                />
                <Chip 
                  label={`Sentiment: ${analysisResult.sentiment}`}
                  color={analysisResult.sentiment === 'positive' ? 'success' : analysisResult.sentiment === 'negative' ? 'error' : 'default'}
                />
                <Chip 
                  label={analysisResult.description || "Detected emotion"}
                  variant="outlined"
                />
              </Stack>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body1">
                  <strong>Suggestion:</strong> {analysisResult.suggestion}
                </Typography>
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                Note: This analysis uses a combination of AI-based text analysis and pattern recognition. 
                For the most accurate results, try to be specific about how you're feeling.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default EmotionAnalysis; 