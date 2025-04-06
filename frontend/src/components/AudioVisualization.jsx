import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, Switch, FormControlLabel, Chip, Grid, Alert, Button, CircularProgress, Tooltip, Divider } from '@mui/material';
import { API_BASE_URL, AUDIO_VISUALIZATION_CONFIG } from '../config';
import MicIcon from '@mui/icons-material/Mic';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import HearingIcon from '@mui/icons-material/Hearing';
import SurroundSoundIcon from '@mui/icons-material/SurroundSound';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PetsIcon from '@mui/icons-material/Pets';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PhoneIcon from '@mui/icons-material/Phone';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import FlightIcon from '@mui/icons-material/Flight';

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

// Create motion components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionTypography = motion(Typography);

const AudioVisualization = ({ mode = 'general', onEmotionDetected, visualStyle = {} }) => {
  const [isActive, setIsActive] = useState(false);
  const [audioLevels, setAudioLevels] = useState([]);
  const [transcriptions, setTranscriptions] = useState([]);
  const [soundAlerts, setSoundAlerts] = useState([]);
  const [processingStatus, setProcessingStatus] = useState({});
  const [connectionError, setConnectionError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [changingMode, setChangingMode] = useState(false);
  const [pendingDemoMode, setPendingDemoMode] = useState(null);
  const canvasRef = useRef(null);
  const waveformCanvasRef = useRef(null);
  const directionIndicatorRef = useRef(null);
  
  // Controls for each feature
  const [speechRecognitionEnabled, setSpeechRecognitionEnabled] = useState(true);
  const [soundDetectionEnabled, setSoundDetectionEnabled] = useState(true);
  const [emotionDetectionEnabled, setEmotionDetectionEnabled] = useState(true);
  
  // Apply default style or use provided style
  const style = {
    primaryColor: '#2196f3',
    secondaryColor: '#64b5f6',
    accentColor: '#f50057',
    borderRadius: '8px',
    title: 'Audio Visualization',
    showEmotions: true,
    showTranscriptions: true,
    showSoundAlerts: true,
    showDirectionIndicator: false,
    ...visualStyle
  };
  
  // Initialize component
  useEffect(() => {
    // Check backend status on mount, but only once
    if (!changingMode) {
    checkStatus();
    }
    
    // Set up interval to fetch data
    const intervalId = setInterval(() => {
      if (!changingMode) {
        // Always fetch data in demo mode regardless of isActive state
        // Only fetch when active in microphone mode
        if (demoMode || isActive) {
          fetchAudioLevels();
          fetchTranscriptions();
          fetchSoundAlerts();
        }
      } else if (connectionError) {
        // Even if not active, periodically check status to auto-reconnect
        console.log("Attempting to reconnect to backend...");
        checkStatus();
      }
    }, AUDIO_VISUALIZATION_CONFIG.refreshInterval);
    
    return () => {
      clearInterval(intervalId);
      // If using real microphone and active, stop processing on unmount
      if (isActive && !demoMode) {
        stopProcessing();
      }
    };
  }, [isActive, demoMode, connectionError, changingMode]);
  
  // Draw visualizations whenever data updates
  useEffect(() => {
    if (audioLevels.length > 0) {
      drawWaveform();
      drawLevelsVisualization();
    }
    
    // Update sound direction indicator based on latest sound alert
    if (soundAlerts.length > 0) {
      const latestAlert = soundAlerts[0];
      // Use sound_type or sound field, whichever is available
      const soundType = latestAlert.sound_type || latestAlert.sound;
      
      if (latestAlert.angle !== undefined) {
        drawDirectionIndicator(latestAlert.angle, soundType);
      } else if (latestAlert.direction) {
        // If we have a text direction without an angle, convert it to an angle
        const directionToAngle = {
          'North': 0,
          'North-East': 45,
          'Northeast': 45,
          'East': 90,
          'South-East': 135,
          'Southeast': 135,
          'South': 180,
          'South-West': 225,
          'Southwest': 225,
          'West': 270,
          'North-West': 315,
          'Northwest': 315
        };
        
        if (directionToAngle[latestAlert.direction]) {
          drawDirectionIndicator(directionToAngle[latestAlert.direction], soundType);
        }
      }
    } else {
      // If no sound alerts, draw a neutral direction indicator
      if (directionIndicatorRef.current) {
        drawDirectionIndicator(0, null, true);
      }
    }
  }, [audioLevels, soundAlerts]);
  
  // Check backend API status
  const checkStatus = async () => {
    try {
      console.log("Checking backend status...");
      const response = await fetch(`${API_BASE_URL}/status`);
      const data = await response.json();
      console.log("Backend status:", data);
      
      setProcessingStatus(data);
      setConnectionError(false);
      setLoading(false);
      
      // Update demo mode state
      setDemoMode(!!data.demo_mode);
      
      // If backend is already processing, update our state
      if (data.audio_processing) {
        setIsActive(true);
      } else if (demoMode) {
        // In demo mode, we don't need to start anything
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setConnectionError(true);
      setLoading(false);
    }
  };
  
  // Fetch current audio levels from API
  const fetchAudioLevels = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-levels`);
      const data = await response.json();
      setAudioLevels(data.levels || []);
      setConnectionError(false);
    } catch (error) {
      console.error('Error fetching audio levels:', error);
      setConnectionError(true);
    }
  };
  
  // Fetch recent transcriptions
  const fetchTranscriptions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/transcriptions?limit=5`);
      const data = await response.json();
      setTranscriptions(data);
      setConnectionError(false);
      
      // If there's an emotion detection callback and we have transcriptions with emotions
      if (onEmotionDetected && data.length > 0 && data[0].emotion) {
        onEmotionDetected({
          emotion: data[0].emotion,
          intensity: data[0].emotion_intensity || 'medium',
          confidence: data[0].emotion_confidence || 0.7
        });
      }
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      setConnectionError(true);
    }
  };
  
  // Fetch recent sound alerts
  const fetchSoundAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sounds?limit=5`);
      const data = await response.json();
      
      // For demo mode, generate dynamic mock data or use backend data if available
      if (demoMode) {
        // If we have real data from backend, use it
        if (data && data.length > 0) {
      setSoundAlerts(data);
        } else {
          // Otherwise generate and rotate mock data
          const currentTime = Date.now() / 1000;
          
          // Define our mock sounds with variety of sound types
          const mockSounds = [
            {
              sound_type: "Door bell",
              sound: "Door bell",
              priority: "important",
              direction: "East",
              angle: 90,
              confidence: 0.92,
              timestamp: currentTime - 2,
              time: currentTime - 2
            },
            {
              sound_type: "Dog barking",
              sound: "Dog barking",
              priority: "normal",
              direction: "North-West",
              angle: 315,
              confidence: 0.85,
              timestamp: currentTime - 30,
              time: currentTime - 30
            },
            {
              sound_type: "Car horn",
              sound: "Car horn",
              priority: "critical",
              direction: "South",
              angle: 180,
              confidence: 0.95,
              timestamp: currentTime - 60,
              time: currentTime - 60
            },
            {
              sound_type: "Phone ringing",
              sound: "Phone ringing",
              priority: "important",
              direction: "North-East",
              angle: 45,
              confidence: 0.88,
              timestamp: currentTime - 90,
              time: currentTime - 90
            },
            {
              sound_type: "Siren",
              sound: "Siren",
              priority: "critical",
              direction: "West",
              angle: 270,
              confidence: 0.97,
              timestamp: currentTime - 120,
              time: currentTime - 120
            },
            {
              sound_type: "Glass breaking",
              sound: "Glass breaking",
              priority: "critical",
              direction: "South-East",
              angle: 135,
              confidence: 0.91,
              timestamp: currentTime - 150,
              time: currentTime - 150
            },
            {
              sound_type: "Keyboard typing",
              sound: "Keyboard typing",
              priority: "normal",
              direction: "North",
              angle: 0,
              confidence: 0.82,
              timestamp: currentTime - 180,
              time: currentTime - 180
            },
            {
              sound_type: "Baby crying", 
              sound: "Baby crying",
              priority: "important",
              direction: "South-West",
              angle: 225,
              confidence: 0.89,
              timestamp: currentTime - 210,
              time: currentTime - 210
            },
            {
              sound_type: "Music playing",
              sound: "Music playing",
              priority: "normal",
              direction: "North-East",
              angle: 45,
              confidence: 0.93,
              timestamp: currentTime - 240,
              time: currentTime - 240
            },
            {
              sound_type: "Bird chirping",
              sound: "Bird chirping",
              priority: "low",
              direction: "East",
              angle: 90,
              confidence: 0.87,
              timestamp: currentTime - 270,
              time: currentTime - 270
            },
            {
              sound_type: "Coughing",
              sound: "Coughing",
              priority: "low",
              direction: "North",
              angle: 0,
              confidence: 0.81,
              timestamp: currentTime - 300,
              time: currentTime - 300
            },
            {
              sound_type: "Footsteps",
              sound: "Footsteps",
              priority: "normal",
              direction: "South",
              angle: 180,
              confidence: 0.86,
              timestamp: currentTime - 330,
              time: currentTime - 330
            },
            {
              sound_type: "Microwave beeping",
              sound: "Microwave beeping",
              priority: "low",
              direction: "West",
              angle: 270,
              confidence: 0.90,
              timestamp: currentTime - 360,
              time: currentTime - 360
            },
            {
              sound_type: "Cat meowing",
              sound: "Cat meowing",
              priority: "normal",
              direction: "North-West",
              angle: 315,
              confidence: 0.88,
              timestamp: currentTime - 390,
              time: currentTime - 390
            },
            {
              sound_type: "Vacuum cleaner",
              sound: "Vacuum cleaner",
              priority: "normal",
              direction: "South-East",
              angle: 135,
              confidence: 0.84,
              timestamp: currentTime - 420,
              time: currentTime - 420
            },
            {
              sound_type: "Whistle",
              sound: "Whistle",
              priority: "low",
              direction: "North-East",
              angle: 45,
              confidence: 0.79,
              timestamp: currentTime - 450,
              time: currentTime - 450
            },
            {
              sound_type: "Gunshot",
              sound: "Gunshot",
              priority: "critical",
              direction: "South",
              angle: 180,
              confidence: 0.98,
              timestamp: currentTime - 480,
              time: currentTime - 480
            },
            {
              sound_type: "Fireworks",
              sound: "Fireworks",
              priority: "important",
              direction: "North-West",
              angle: 315,
              confidence: 0.93,
              timestamp: currentTime - 510,
              time: currentTime - 510
            },
            {
              sound_type: "Rain",
              sound: "Rain",
              priority: "low",
              direction: "East",
              angle: 90,
              confidence: 0.91,
              timestamp: currentTime - 540,
              time: currentTime - 540
            }
          ];
          
          // Change sound every few seconds for a dynamic experience
          const rotationPeriod = 3; // seconds (reduced from 6 to 3 seconds)
          const cyclePosition = Math.floor(currentTime / rotationPeriod) % mockSounds.length;
          
          // Select a variety of sounds with different priorities for display
          const soundsWithVariedPriorities = [
            // Always include the current cycled sound first
            mockSounds[cyclePosition],
            // Make sure we include at least one of each priority
            mockSounds.find(s => s.priority === "critical") || mockSounds[16], // Gunshot (critical)
            mockSounds.find(s => s.priority === "important") || mockSounds[0], // Door bell (important)
            mockSounds.find(s => s.priority === "normal") || mockSounds[1],    // Dog barking (normal)
            mockSounds.find(s => s.priority === "low") || mockSounds[9],       // Bird chirping (low)
            // Add a few more random sounds
            ...mockSounds.filter((_, i) => i !== cyclePosition).slice(0, 4)
          ];
          
          // Ensure all sounds have proper priority values
          const processedMockSounds = soundsWithVariedPriorities.map(sound => {
            // Explicitly force the priority to be one of the expected values
            let priority = sound.priority || getPriorityFromSound(sound.sound_type || sound.sound);
            
            // Make sure the priority is exactly one of our expected values
            if (!['low', 'normal', 'important', 'critical'].includes(priority)) {
              // Default to normal if the priority is invalid
              priority = 'normal';
            }
            
            return {
              ...sound,
              // Set the corrected priority
              priority: priority
            };
          });
          
          setSoundAlerts(processedMockSounds);
        }
      } else if (data && data.length > 0) {
        // Handle regular microphone mode
        // Ensure all sounds have proper attributes for display
        const processedSounds = data.map(sound => ({
          ...sound,
          // Ensure priority is set
          priority: sound.priority || getPriorityFromSound(sound.sound_type || sound.sound),
          // Calculate angle from direction if missing
          angle: sound.angle || getAngleFromDirection(sound.direction)
        }));
        
        setSoundAlerts(processedSounds);
      } else if (!isActive) {
        // If no data and not active, clear the alerts
        setSoundAlerts([]);
      }
      
      setConnectionError(false);
    } catch (error) {
      console.error('Error fetching sound alerts:', error);
      setConnectionError(true);
    }
  };
  
  // Convert sound type to priority if not provided
  const getPriorityFromSound = (soundType) => {
    if (!soundType) return 'normal';
    
    const criticalSounds = ['siren', 'alarm', 'fire', 'emergency', 'crash', 'breaking', 'scream', 'horn', 'police'];
    const importantSounds = ['doorbell', 'door bell', 'phone', 'calling', 'baby', 'crying', 'shout'];
    const lowPrioritySounds = ['bird', 'chirp', 'nature', 'typing', 'keyboard', 'beep', 'microwave', 'ambient', 'low', 'quiet'];
    
    const lowerCaseSound = soundType.toLowerCase();
    
    for (const sound of criticalSounds) {
      if (lowerCaseSound.includes(sound)) return 'critical';
    }
    
    for (const sound of importantSounds) {
      if (lowerCaseSound.includes(sound)) return 'important';
    }
    
    for (const sound of lowPrioritySounds) {
      if (lowerCaseSound.includes(sound)) return 'low';
    }
    
    return 'normal';
  };
  
  // Convert text direction to angle if needed
  const getAngleFromDirection = (direction) => {
    if (!direction) return undefined;
    
    const directionToAngle = {
      'North': 0,
      'North-East': 45,
      'Northeast': 45,
      'East': 90,
      'South-East': 135,
      'Southeast': 135,
      'South': 180,
      'South-West': 225,
      'Southwest': 225,
      'West': 270,
      'North-West': 315,
      'Northwest': 315
    };
    
    return directionToAngle[direction];
  };
  
  // Start audio processing
  const startProcessing = async () => {
    try {
      console.log("Starting audio processing...");
      const response = await fetch(`${API_BASE_URL}/start`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log("Start response:", data);
      
      if (data.status === 'started' || data.status === 'already_running') {
        setIsActive(true);
        
        // Initial data fetch after starting
        fetchAudioLevels();
        fetchTranscriptions();
        fetchSoundAlerts();
      }
    } catch (error) {
      console.error('Error starting processing:', error);
      setConnectionError(true);
    }
  };
  
  // Stop audio processing
  const stopProcessing = async () => {
    try {
      console.log("Stopping audio processing...");
      const response = await fetch(`${API_BASE_URL}/stop`, {
        method: 'POST',
      });
      const data = await response.json();
      console.log("Stop response:", data);
      
      if (data.status === 'stopped') {
        setIsActive(false);
      }
    } catch (error) {
      console.error('Error stopping processing:', error);
      setConnectionError(true);
    }
  };
  
  // Toggle audio processing
  const toggleProcessing = () => {
    if (isActive) {
      stopProcessing();
    } else {
      startProcessing();
    }
  };
  
  // Toggle demo mode
  const toggleDemoMode = async () => {
    try {
      // Block data fetching during mode change
      setChangingMode(true);
      
      // Store the target mode we want to switch to
      const targetDemoMode = !demoMode;
      setPendingDemoMode(targetDemoMode);
      
      console.log(`Setting demo mode to: ${targetDemoMode}`);
      
      const response = await fetch(`${API_BASE_URL}/set-demo-mode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demo_mode: targetDemoMode }),
      });
      
      const data = await response.json();
      console.log("Set demo mode response:", data);
      
      if (data.success) {
        // Clear existing data
        clearData();
        
        // If switching to real microphone mode and isActive is true,
        // start real microphone processing
        if (!targetDemoMode && isActive) {
          await startProcessing();
        }
        
        // Wait a moment for the backend to restart processing
        setTimeout(() => {
          // Now we can update the demo mode state
          setDemoMode(targetDemoMode);
          setPendingDemoMode(null);
          // Unblock data fetching
          setChangingMode(false);
          
          // Fetch the initial data after mode change
          if (targetDemoMode || isActive) {
            fetchAudioLevels();
            fetchTranscriptions();
            fetchSoundAlerts();
          }
        }, 1500);
      } else {
        console.error("Failed to set demo mode:", data.error);
        // Reset pending state
        setPendingDemoMode(null);
        // Unblock data fetching
        setChangingMode(false);
      }
    } catch (error) {
      console.error('Error setting demo mode:', error);
      setConnectionError(true);
      // Reset pending state
      setPendingDemoMode(null);
      // Unblock data fetching
      setChangingMode(false);
    }
  };
  
  // Clear all data
  const clearData = async () => {
    try {
      console.log("Clearing all data...");
      await fetch(`${API_BASE_URL}/clear-data`, {
        method: 'POST',
      });
      
      // Clear local state
      setTranscriptions([]);
      setSoundAlerts([]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };
  
  // Update preferences when controls change
  const updatePreferences = async (key, value) => {
    try {
      console.log(`Updating preference: ${key} = ${value}`);
      const response = await fetch(`${API_BASE_URL}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });
      await response.json();
    } catch (error) {
      console.error('Error updating preferences:', error);
      setConnectionError(true);
    }
  };
  
  // Draw audio level visualization
  const drawLevelsVisualization = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background with subtle grid
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw subtle grid lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    
    // Vertical grid lines
    for (let x = 0; x < width; x += 50) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    // Horizontal grid lines
    for (let y = 0; y < height; y += 25) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
    
    // Draw audio levels with enhanced aesthetics
    const barWidth = width / Math.max(1, audioLevels.length);
    const maxLevel = Math.max(...audioLevels, 0.01);
    
    for (let i = 0; i < audioLevels.length; i++) {
      const level = audioLevels[i] / maxLevel;
      const barHeight = level * height * 0.9; // 90% of height max to leave some margin
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      
      // Beautiful multi-color gradient based on level
      gradient.addColorStop(0, 'rgba(33, 150, 243, 0.8)');
      gradient.addColorStop(0.6, 'rgba(3, 169, 244, 0.8)');
      gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
      
      // Draw bar with rounded top
      ctx.beginPath();
      ctx.moveTo(i * barWidth, height);
      ctx.lineTo(i * barWidth, height - barHeight);
      
      // Rounded top
      ctx.quadraticCurveTo(
        i * barWidth + barWidth / 2,
        height - barHeight - 5,
        i * barWidth + barWidth,
        height - barHeight
      );
      
      ctx.lineTo(i * barWidth + barWidth, height);
      ctx.closePath();
      
      // Fill with gradient
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = 'rgba(0, 255, 255, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw highlight on top of bar
      if (barHeight > 10) {
        ctx.beginPath();
        ctx.arc(
          i * barWidth + barWidth / 2,
          height - barHeight + 5,
          2,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add reflection effect
    ctx.globalAlpha = 0.2;
    ctx.save();
    ctx.scale(1, -0.3); // Flip and scale vertically for reflection
    ctx.translate(0, -height * 3.3); // Position the reflection
    
    // Redraw bars for reflection
    for (let i = 0; i < audioLevels.length; i++) {
      const level = audioLevels[i] / maxLevel;
      const barHeight = level * height * 0.9;
      
      ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
      ctx.fillRect(i * barWidth, height, barWidth - 1, -barHeight);
    }
    
    ctx.restore();
    ctx.globalAlpha = 1.0;
  };
  
  // Draw waveform visualization
  const drawWaveform = () => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw subtle center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.stroke();
    
    if (audioLevels.length === 0) return;
    
    // Apply shadow for glow effect
    ctx.shadowColor = 'rgba(33, 150, 243, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw waveform with enhanced aesthetics
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    
    const step = width / audioLevels.length;
    
    // Top curve - smooth with bezier curves
    for (let i = 0; i < audioLevels.length - 1; i++) {
      const x = i * step;
      const nextX = (i + 1) * step;
      const y = height / 2 - (audioLevels[i] * height * 0.4);
      const nextY = height / 2 - (audioLevels[i + 1] * height * 0.4);
      
      // Calculate control points for smooth curve
      const cpX = (x + nextX) / 2;
      const cpY = height / 2 - ((audioLevels[i] + audioLevels[i + 1]) / 2 * height * 0.4);
      
      if (i === 0) {
        ctx.moveTo(x, y);
      }
      
      // Use quadratic curve for smoother rendering
      ctx.quadraticCurveTo(cpX, cpY, nextX, nextY);
    }
    
    // Continue to bottom curve (in reverse)
    for (let i = audioLevels.length - 1; i > 0; i--) {
      const x = i * step;
      const prevX = (i - 1) * step;
      const y = height / 2 + (audioLevels[i] * height * 0.4);
      const prevY = height / 2 + (audioLevels[i - 1] * height * 0.4);
      
      // Calculate control points for smooth curve
      const cpX = (x + prevX) / 2;
      const cpY = height / 2 + ((audioLevels[i] + audioLevels[i - 1]) / 2 * height * 0.4);
      
      ctx.quadraticCurveTo(cpX, cpY, prevX, prevY);
    }
    
    ctx.closePath();
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(3, 169, 244, 0.5)');
    gradient.addColorStop(0.5, 'rgba(33, 150, 243, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.5)');
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Add stroke
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add animated dots on top curve for extra effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const time = Date.now() / 1000;
    for (let i = 0; i < audioLevels.length; i += 5) {
      const dotSize = 2 + Math.sin(time + i * 0.2) * 1;
      const x = i * step;
      const y = height / 2 - (audioLevels[i] * height * 0.4);
      
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw direction indicator with color based on sound type
  const drawDirectionIndicator = (angle, soundType, isIdle = false) => {
    const canvas = directionIndicatorRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Get a color based on the sound type
    const soundTypeColor = isIdle ? '#9e9e9e' : getSoundTypeColor(soundType);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw circular background with gradient
    const bgGradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.1,
      centerX, centerY, radius * 1.2
    );
    bgGradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
    
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outer circle (compass)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add cardinal direction markers
    const directions = ['N', 'E', 'S', 'W'];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < directions.length; i++) {
      const dirAngle = i * Math.PI / 2;
      const dirX = centerX + (radius + 10) * Math.sin(dirAngle);
      const dirY = centerY - (radius + 10) * Math.cos(dirAngle);
      ctx.fillText(directions[i], dirX, dirY);
    }
    
    // Draw tick marks around the circle (every 30 degrees)
    ctx.beginPath();
    for (let i = 0, degrees = 0; i < 12; i++, degrees += 30) {
      const tickAngle = i * (Math.PI / 6);
      const innerRadius = i % 3 === 0 ? radius - 10 : radius - 5; // Longer ticks at major angles
      
      const startX = centerX + innerRadius * Math.sin(tickAngle);
      const startY = centerY - innerRadius * Math.cos(tickAngle);
      const endX = centerX + radius * Math.sin(tickAngle);
      const endY = centerY - radius * Math.cos(tickAngle);
      
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      
      // Add degree labels at each major tick (every 90 degrees)
      if (i % 3 === 0 && i > 0) {
        const labelX = centerX + (radius - 25) * Math.sin(tickAngle);
        const labelY = centerY - (radius - 25) * Math.cos(tickAngle);
        ctx.fillText(degrees.toString() + "°", labelX, labelY);
      }
    }
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // If in idle state, just draw the center point
    if (isIdle) {
      // Draw pulsing center circle
      const pulseTime = Date.now() / 1000;
      const pulseSize = 8 + Math.sin(pulseTime * 2) * 4;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = `${soundTypeColor}99`; // 60% opacity
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for sounds...', centerX, centerY + radius + 30);
      
      return;
    }
    
    // Convert angle from degrees to radians for active state
    const angleInRadians = (angle - 90) * (Math.PI / 180);
    
    // Get the direction text
    const directionText = getDirectionText(angle);
    
    // Draw the direction indicator (with glow effect based on sound type)
    ctx.shadowColor = soundTypeColor;
    ctx.shadowBlur = 15;
    
    // Draw the cone of direction
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const coneWidth = Math.PI / 6; // 30 degrees wide cone
    
    // Draw the cone using standard canvas methods
    ctx.arc(centerX, centerY, radius, angleInRadians - coneWidth, angleInRadians + coneWidth);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    
    // Use a semi-transparent fill based on sound type
    ctx.fillStyle = `${soundTypeColor}4D`; // 30% opacity
    ctx.fill();
    
    // Add a subtle radial gradient overlay to simulate directional light
    const glowRadius = radius * 0.7;
    const glowX = centerX + Math.cos(angleInRadians) * radius * 0.4;
    const glowY = centerY + Math.sin(angleInRadians) * radius * 0.4;
    
    const glowGradient = ctx.createRadialGradient(
      glowX, glowY, 0,
      glowX, glowY, glowRadius
    );
    glowGradient.addColorStop(0, `${soundTypeColor}66`); // 40% opacity
    glowGradient.addColorStop(1, `${soundTypeColor}00`); // 0% opacity
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, angleInRadians - coneWidth, angleInRadians + coneWidth);
    ctx.lineTo(centerX, centerY);
    ctx.closePath();
    ctx.fillStyle = glowGradient;
    ctx.fill();
    
    // Draw pulsing circles at the edge of the direction line
    const pulseTime = Date.now() / 1000;
    const pulseX = centerX + radius * Math.cos(angleInRadians);
    const pulseY = centerY + radius * Math.sin(angleInRadians);
    
    // Draw 3 pulsing circles
    for (let i = 0; i < 3; i++) {
      const pulseSize = 6 + Math.sin(pulseTime * 3 + i * 2) * 3;
      const pulseOpacity = 0.7 - (i * 0.2);
      
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = `${soundTypeColor}${Math.floor(pulseOpacity * 255).toString(16).padStart(2, '0')}`;
      ctx.fill();
    }
    
    // Draw direction line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    const targetX = centerX + radius * Math.cos(angleInRadians);
    const targetY = centerY + radius * Math.sin(angleInRadians);
    ctx.lineTo(targetX, targetY);
    
    ctx.strokeStyle = soundTypeColor;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fillStyle = `${soundTypeColor}CC`; // 80% opacity
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Add sound direction
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(directionText, centerX, centerY + radius + 20);
    
    if (!isIdle) {
      // Add angle text
    ctx.font = '14px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(angle)}°`, centerX, centerY + radius + 40);
      
      // Draw sound type label
      if (soundType) {
        // Add a background for the text
        ctx.fillStyle = `${soundTypeColor}CC`;
        ctx.fillRect(centerX - 30, centerY + radius + 54, 60, 20);
        
        // Add the sound type text
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(soundType, centerX, centerY + radius + 68);
      }
    } else {
      // Show waiting message in idle mode
      ctx.font = '14px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('Waiting for sounds...', centerX, centerY + radius + 40);
    }
  };
  
  // Get color based on sound type
  const getSoundTypeColor = (soundType) => {
    if (!soundType) return '#9c27b0'; // Default purple
    
    const soundColors = {
      'Door bell': '#2196f3', // Blue
      'Doorbell': '#2196f3', // Blue
      'Bell': '#64b5f6', // Light Blue
      'Dog barking': '#4caf50', // Green
      'Dog': '#4caf50', // Green
      'Barking': '#8bc34a', // Light Green
      'Car horn': '#f44336', // Red
      'Horn': '#f44336', // Red
      'Car': '#e53935', // Red
      'Phone ringing': '#ff9800', // Orange
      'Phone': '#ff9800', // Orange
      'Ringing': '#ffa726', // Light Orange
      'Siren': '#e91e63', // Pink
      'Alarm': '#e91e63', // Pink
      'Emergency': '#d81b60', // Dark Pink
      'Speech': '#3f51b5', // Indigo
      'Voice': '#3f51b5', // Indigo
      'Music': '#9c27b0', // Purple
      'Knock': '#8d6e63', // Brown
      'Footsteps': '#795548', // Brown
      'Breaking': '#f44336', // Red
      'Crash': '#f44336', // Red
      'Baby': '#ff4081', // Pink accent
      'Crying': '#ff4081', // Pink accent
      'Bird': '#00bcd4', // Cyan
      'Chirping': '#00bcd4', // Cyan
      'Cat': '#9575cd', // Deep purple light
      'Meowing': '#9575cd', // Deep purple light
      'Coughing': '#78909c', // Blue grey
      'Vacuum': '#607d8b', // Blue grey
      'Microwave': '#00acc1', // Cyan dark
      'Beeping': '#26c6da', // Cyan light
      'Typing': '#78909c', // Blue grey
      'Keyboard': '#78909c' // Blue grey
    };
    
    // Try to match the sound type to our color map
    for (const [key, color] of Object.entries(soundColors)) {
      if (soundType.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    
    // Fallback color based on first character
    const fallbackColors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4caf50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    
    const charCode = (soundType.charCodeAt(0) || 65) % fallbackColors.length;
    return fallbackColors[charCode];
  };
  
  // Get chip background color based on emotion
  const getEmotionColor = (emotion) => {
    const emotionColors = {
      happy: '#4caf50',
      excited: '#8bc34a',
      sad: '#2196f3',
      angry: '#f44336',
      surprised: '#ff9800',
      confused: '#9c27b0',
      frustrated: '#e91e63',
      neutral: '#9e9e9e',
      concerned: '#607d8b',
      sarcastic: '#ff5722'
    };
    
    return emotionColors[emotion] || '#9e9e9e';
  };

  // Helper function to safely format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    // Try to convert to number if it's a string
    if (typeof timestamp === 'string') {
      timestamp = parseFloat(timestamp);
    }
    
    // Check if timestamp is in seconds (Unix timestamp) or milliseconds
    // Unix timestamps are typically 10 digits for seconds, 13 for milliseconds
    if (timestamp < 10000000000) {
      // Convert seconds to milliseconds
      timestamp = timestamp * 1000;
    }
    
    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Just now';
      }
      return date.toLocaleTimeString();
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Just now';
    }
  };

  // Get text description of sound direction based on angle
  const getDirectionText = (angle) => {
    // Normalize angle to 0-360
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // Define direction ranges and their text
    const directions = [
      { min: 337.5, max: 360, text: "North" },
      { min: 0, max: 22.5, text: "North" },
      { min: 22.5, max: 67.5, text: "North-East" },
      { min: 67.5, max: 112.5, text: "East" },
      { min: 112.5, max: 157.5, text: "South-East" },
      { min: 157.5, max: 202.5, text: "South" },
      { min: 202.5, max: 247.5, text: "South-West" },
      { min: 247.5, max: 292.5, text: "West" },
      { min: 292.5, max: 337.5, text: "North-West" }
    ];
    
    // Find the matching direction
    const direction = directions.find(dir => 
      normalizedAngle >= dir.min && normalizedAngle < dir.max
    );
    
    return direction ? direction.text : "Unknown";
  };

  // Get alert priority text and color
  const getAlertPriority = (priority) => {
    if (!priority) return "Normal";
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };
  
  const getAlertPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "error";
      case "important":
        return "warning";
      case "low":
        return "success";
      case "normal":
      default:
        return "info";
    }
  };

  // Check if emotion was detected using fallback method
  const isEmotionFallback = (transcription) => {
    return transcription.explanation?.includes('keyword detection') || 
           transcription.source === 'fallback';
  };

  // Modify the UI based on the selected mode
  useEffect(() => {
    // Apply different settings based on mode
    if (mode === 'speech') {
      setSpeechRecognitionEnabled(true);
      setSoundDetectionEnabled(false);
      setEmotionDetectionEnabled(true);
    } else if (mode === 'spatial') {
      setSpeechRecognitionEnabled(false);
      setSoundDetectionEnabled(true);
      setEmotionDetectionEnabled(false);
    } else {
      // Default 'general' mode - enable all features
      setSpeechRecognitionEnabled(true);
      setSoundDetectionEnabled(true);
      setEmotionDetectionEnabled(true);
    }
  }, [mode]);
  
  // Helper function to get an appropriate icon for a sound type
  const getSoundTypeIcon = (soundType) => {
    const soundLower = (soundType || '').toLowerCase();
    
    // Map common sound types to Material-UI icons
    if (soundLower.includes('speech') || soundLower.includes('speaking') || soundLower.includes('talk')) {
      return <RecordVoiceOverIcon fontSize="small" />;
    } else if (soundLower.includes('music') || soundLower.includes('singing')) {
      return <MusicNoteIcon fontSize="small" />;
    } else if (soundLower.includes('dog') || soundLower.includes('bark')) {
      return <PetsIcon fontSize="small" />;
    } else if (soundLower.includes('cat') || soundLower.includes('meow')) {
      return <PetsIcon fontSize="small" />;
    } else if (soundLower.includes('car') || soundLower.includes('vehicle') || soundLower.includes('engine')) {
      return <DirectionsCarIcon fontSize="small" />;
    } else if (soundLower.includes('phone') || soundLower.includes('ring')) {
      return <PhoneIcon fontSize="small" />;
    } else if (soundLower.includes('alarm') || soundLower.includes('siren') || soundLower.includes('alert')) {
      return <NotificationsActiveIcon fontSize="small" />;
    } else if (soundLower.includes('door') || soundLower.includes('knock')) {
      return <DoorFrontIcon fontSize="small" />;
    } else if (soundLower.includes('baby') || soundLower.includes('cry')) {
      return <ChildCareIcon fontSize="small" />;
    } else if (soundLower.includes('bird') || soundLower.includes('chirp')) {
      return <FlightIcon fontSize="small" />;
    } else {
      // Default sound icon
      return <VolumeUpIcon fontSize="small" />;
    }
  };
  
  // Helper function to create a direction indicator icon based on angle
  const directionIndicatorIcon = (angle) => {
    if (angle === undefined) return null;
    
    // Create a small SVG arrow pointing in the direction
    const normalizedAngle = ((angle % 360) + 360) % 360;
    
    // Generate SVG path for an arrow pointing in the right direction
    const arrowPath = `
      <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <g transform="rotate(${normalizedAngle} 12 12)">
          <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" 
                fill="currentColor" />
        </g>
      </svg>
    `;
    
    // Return the SVG as an HTML element
    return (
      <Box
        sx={{ 
          display: 'inline-flex', 
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16
        }}
        dangerouslySetInnerHTML={{ __html: arrowPath }}
      />
    );
  };

  // If loading, show spinner
  if (loading) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6">
          Connecting to audio service...
        </Typography>
      </Paper>
    );
  }
  
  // If mode is changing, show spinner
  if (changingMode) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="h6">
          {pendingDemoMode ? "Switching to demo mode..." : "Switching to real microphone mode..."}
        </Typography>
      </Paper>
    );
  }
  
  // If connection error, show error message
  if (connectionError) {
    return (
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3, 
          borderRadius: 2, 
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 2
        }}
      >
        <ErrorOutlineIcon color="error" sx={{ fontSize: 64 }} />
        <Typography variant="h6" align="center" gutterBottom>
          Connection Error
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          Could not connect to the audio processing backend.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<RefreshIcon />}
          onClick={checkStatus}
        >
          Retry Connection
        </Button>
      </Paper>
    );
  }
  
  return (
    <MotionPaper 
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      elevation={3} 
      sx={{ 
        p: 3, 
        borderRadius: style.borderRadius || 2, 
        background: `rgba(0, 0, 0, 0.6)`,
        backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4))`,
        color: 'white',
        height: '100%',
        border: `1px solid ${style.primaryColor}22`,
        boxShadow: `0 4px 20px ${style.primaryColor}33`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative elements with custom colors */}
      <MotionBox
        component={motion.div}
        sx={{
          position: 'absolute',
          top: -150,
          right: -150,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${style.primaryColor}1A 0%, ${style.primaryColor}00 70%)`,
          zIndex: 0
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatType: "reverse"
        }}
      />
      
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <MotionTypography 
          component={motion.div}
          variants={itemVariants}
          variant="h5" 
          gutterBottom
          sx={{
            fontWeight: 'bold',
            borderBottom: `2px solid ${style.primaryColor}80`,
            pb: 1,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {mode === 'speech' ? (
            <HearingIcon sx={{ mr: 1, verticalAlign: 'middle', color: style.primaryColor }} />
          ) : mode === 'spatial' ? (
            <SurroundSoundIcon sx={{ mr: 1, verticalAlign: 'middle', color: style.primaryColor }} />
          ) : (
            <SurroundSoundIcon sx={{ mr: 1, verticalAlign: 'middle', color: style.primaryColor }} />
          )}
          {style.title || 'Audio Visualization'} {demoMode && '(Demo Mode)'}
        </MotionTypography>
      
      {/* Status and Controls */}
        <MotionBox 
          component={motion.div}
          variants={itemVariants}
          sx={{ 
            mb: 3, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: 1,
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 2,
            p: 1
          }}
        >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Only show Active toggle when not in demo mode */}
          {!demoMode && (
            <FormControlLabel
              control={
                <Switch 
                  checked={isActive} 
                  onChange={toggleProcessing} 
                  color="primary"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: style.primaryColor,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: style.primaryColor,
                      },
                    }}
                />
              }
              label={isActive ? "Microphone Active" : "Microphone Inactive"}
            />
          )}
          
          <Tooltip title={demoMode ? "Switch to real microphone input" : "Switch to simulated demo data"}>
            <FormControlLabel
              control={
                <Switch 
                  checked={demoMode} 
                  onChange={toggleDemoMode}
                  color="secondary"
                  icon={<MicIcon />}
                  checkedIcon={<SmartToyIcon />}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: style.primaryColor,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: style.primaryColor,
                      },
                    }}
                />
              }
              label="Demo Mode"
            />
          </Tooltip>
        </Box>
        
        <Box>
          <Button
              startIcon={<RefreshIcon />} 
            onClick={clearData}
              variant="outlined"
              size="small"
              color="primary"
              sx={{ mr: 1, borderColor: style.primaryColor }}
          >
            Clear Data
          </Button>
          
            {connectionError && (
              <Button 
                startIcon={<RefreshIcon />}
                onClick={checkStatus}
                variant="contained"
                size="small"
                color="error"
              >
                Reconnect
              </Button>
            )}
          </Box>
        </MotionBox>
        
        {/* Feature Toggles */}
        <MotionBox 
          component={motion.div}
          variants={itemVariants}
          sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1, 
            mb: 2,
          }}
        >
          <Chip 
            icon={<MicIcon />} 
            label="Speech Recognition" 
            color={speechRecognitionEnabled ? "primary" : "default"}
            sx={{ 
              boxShadow: speechRecognitionEnabled ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' 
              }
            }}
            onClick={() => {
              const newValue = !speechRecognitionEnabled;
              setSpeechRecognitionEnabled(newValue);
              updatePreferences('transcription_enabled', newValue);
            }}
          />
          <Chip 
            icon={<SurroundSoundIcon />} 
            label="Sound Detection" 
            color={soundDetectionEnabled ? "primary" : "default"}
            sx={{ 
              boxShadow: soundDetectionEnabled ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' 
              }
            }}
            onClick={() => {
              const newValue = !soundDetectionEnabled;
              setSoundDetectionEnabled(newValue);
              updatePreferences('sound_detection_enabled', newValue);
            }}
          />
          <Chip 
            icon={<VisibilityIcon />} 
            label="Emotion Detection" 
            color={emotionDetectionEnabled ? "primary" : "default"}
            sx={{ 
              boxShadow: emotionDetectionEnabled ? '0 0 8px rgba(33, 150, 243, 0.5)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)' 
              }
            }}
            onClick={() => {
              const newValue = !emotionDetectionEnabled;
              setEmotionDetectionEnabled(newValue);
              updatePreferences('emotion_detection_enabled', newValue);
            }}
          />
        </MotionBox>
      
      <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
      
      {demoMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Running in demo mode with simulated data - no microphone access needed. Toggle the "Demo Mode" switch for real audio input.
        </Alert>
      )}
      
      {!demoMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {isActive ? 
            "Using real microphone input. Please grant microphone permissions when prompted." :
            "Microphone is inactive. Click the toggle to start capturing audio."
          }
        </Alert>
      )}
      
      {!processingStatus.models_loaded?.gemini && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Gemini API key not found. A basic fallback emotion detection will be used instead. To enable full emotion detection, set a GOOGLE_API_KEY environment variable.
        </Alert>
      )}
      
      {!processingStatus.models_loaded?.yamnet && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          YAMNet model not loaded. Sound classification may not work.
        </Alert>
      )}
      
      <Grid container spacing={2}>
          {/* Audio Levels Visualization */}
        <Grid item xs={12} md={6}>
            <MotionBox 
              component={motion.div}
              variants={itemVariants}
              sx={{ mb: 3 }}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ color: style.primaryColor }}>
                {mode === 'speech' ? 'Speech Activity' : 'Sound Activity'}
            </Typography>
              <Box sx={{ 
                position: 'relative',
                height: 120, 
                background: 'rgba(0, 0, 0, 0.2)', 
                borderRadius: style.borderRadius || 2, 
                overflow: 'hidden',
                border: `1px solid ${style.primaryColor}22`
              }}>
              <canvas 
                ref={canvasRef} 
                  width="800" 
                  height="200" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                    display: 'block' 
                  }}
                />
                {(!demoMode && !isActive) && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0, 
                    bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    background: 'rgba(0, 0, 0, 0.7)' 
                  }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Toggle "Active" to start audio processing
                    </Typography>
            </Box>
                )}
              </Box>
            </MotionBox>
          </Grid>
          
          {/* Show waveform only in speech mode */}
          {(mode === 'speech' || style.showTranscriptions) && (
            <Grid item xs={12} md={6}>
              <MotionBox 
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: style.primaryColor }}>
              Waveform
            </Typography>
                <Box sx={{ 
                  height: 80, 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: style.borderRadius || 2, 
                overflow: 'hidden',
                  border: `1px solid ${style.primaryColor}22`
                }}>
              <canvas 
                ref={waveformCanvasRef} 
                    width="800" 
                    height="100" 
                style={{ 
                  width: '100%', 
                  height: '100%',
                      display: 'block' 
                }}
              />
            </Box>
              </MotionBox>
        </Grid>
          )}
          
          {/* Direction Indicator for spatial mode */}
          {(mode === 'spatial' || style.showDirectionIndicator) && (
            <Grid item xs={12}>
              <MotionBox 
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: style.primaryColor }}>
              Sound Direction
            </Typography>
                <Box sx={{ 
                  height: 200, 
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: style.borderRadius || 2,
                  overflow: 'hidden',
                  position: 'relative',
                  border: `1px solid ${style.primaryColor}22`,
                display: 'flex',
                alignItems: 'center',
                  justifyContent: 'center',
                }}>
              <canvas 
                ref={directionIndicatorRef} 
                    width="300" 
                    height="300" 
                style={{ 
                      width: 180, 
                      height: 180, 
                      display: 'block',
                    }}
                  />
                  {soundAlerts.length > 0 && (
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 5, 
                      right: 5,
                      background: `${style.primaryColor}CC`,
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      <Box sx={{ color: 'white' }}>
                        {getSoundTypeIcon(soundAlerts[0].sound_type || soundAlerts[0].sound)}
            </Box>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {soundAlerts[0].sound_type || soundAlerts[0].sound || 'Sound'} detected
                      </Typography>
                    </Box>
                  )}
                  
                  {soundAlerts.length > 0 && (soundAlerts[0].angle !== undefined || soundAlerts[0].direction) && (
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 5, 
                      left: 5,
                      background: `${style.accentColor}CC`,
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5
                    }}>
                      {directionIndicatorIcon(soundAlerts[0].angle)}
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {soundAlerts[0].direction || getDirectionText(soundAlerts[0].angle)}
            </Typography>
                    </Box>
                  )}
                  
                  {/* Add direction labels around the circle */}
                  <Box sx={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>North</Typography>
                  </Box>
                  <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>South</Typography>
                  </Box>
                  <Box sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>West</Typography>
                  </Box>
                  <Box sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>East</Typography>
                  </Box>
                </Box>
              </MotionBox>
            </Grid>
          )}
          
          {/* Show sound classification results first in spatial mode */}
          {(mode === 'spatial' || style.showSoundAlerts) && (
            <Grid item xs={12}>
              <MotionBox 
                component={motion.div}
                variants={itemVariants}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ color: style.primaryColor }}>
                  Detected Sounds
                </Typography>
                <Box sx={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: style.borderRadius || 2, 
                  p: 2,
                  maxHeight: 300,
                  overflowY: 'auto',
                  border: `1px solid ${style.primaryColor}22`
                }}>
                  {soundAlerts.length === 0 ? (
                    <Box sx={{ 
                      height: '100%', 
                      minHeight: 100,
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {isActive || demoMode ? "Listening for sounds..." : "Enable processing to detect sounds"}
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {soundAlerts.map((alert, index) => {
                        // Get color for this sound type
                        const alertColor = getSoundTypeColor(alert.sound_type || alert.sound);
                        const direction = alert.direction || (alert.angle !== undefined ? getDirectionText(alert.angle) : null);
                        const directionAngle = alert.angle !== undefined ? alert.angle : getAngleFromDirection(alert.direction);
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Paper
                              elevation={3}
                              sx={{ 
                                p: 1.5, 
                                borderRadius: style.borderRadius || 2, 
                                background: index === 0 
                                  ? `linear-gradient(135deg, ${alertColor}12, ${alertColor}22)`
                                  : 'rgba(0, 0, 0, 0.2)',
                                border: index === 0 ? `1px solid ${alertColor}44` : 'none',
                                position: 'relative',
                                transition: 'all 0.3s ease',
                                overflow: 'hidden',
                                '&:hover': {
                                  transform: 'translateY(-2px)',
                                  boxShadow: `0 4px 12px ${alertColor}33`
                                }
                              }}
                            >
                              {/* Sound type and priority */}
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography variant="body2" fontWeight="bold" sx={{ 
                                  color: index === 0 ? alertColor : 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5
                                }}>
                                  <Box sx={{ 
                                    color: alertColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    {getSoundTypeIcon(alert.sound_type || alert.sound)}
                                  </Box>
                                  {alert.sound_type || alert.sound || 'Unknown sound'} 
                                </Typography>
                                
                                {/* Display raw priority for debugging */}
                                <Chip 
                                  label={getAlertPriority(alert.priority)}
                                  size="small" 
                                  color={getAlertPriorityColor(alert.priority)}
                                  sx={{ 
                                    height: 20, 
                                    fontSize: '0.7rem', 
                                    fontWeight: 'bold',
                                    // Add more style based on priority
                                    ...(alert.priority === 'critical' && {
                                      bgcolor: 'error.main',
                                      color: 'white',
                                      border: '1px solid #d32f2f',
                                      boxShadow: '0 0 5px rgba(211, 47, 47, 0.5)'
                                    }),
                                    ...(alert.priority === 'important' && {
                                      bgcolor: 'warning.main',
                                      color: 'rgba(0, 0, 0, 0.87)',
                                      border: '1px solid #f57c00',
                                      boxShadow: '0 0 5px rgba(245, 124, 0, 0.5)'
                                    }),
                                    ...(alert.priority === 'low' && {
                                      bgcolor: 'success.main',
                                      color: 'white',
                                      border: '1px solid #388e3c',
                                      boxShadow: '0 0 5px rgba(56, 142, 60, 0.5)'
                                    }),
                                    ...(alert.priority === 'normal' && {
                                      bgcolor: 'info.main',
                                      color: 'white',
                                      border: '1px solid #0288d1',
                                      boxShadow: '0 0 5px rgba(2, 136, 209, 0.5)'
                                    })
                                  }} 
                                />
                              </Box>
                              
                              {/* Direction information */}
                              {direction && (
                                <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      backgroundColor: `${alertColor}22`,
                                      border: `1px solid ${alertColor}44`,
                        borderRadius: 1, 
                                      px: 1,
                                      py: 0.5,
                                    }}
                                  >
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        fontWeight: 'bold', 
                                        color: alertColor,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                                      {/* Show direction icon based on angle */}
                                      {directionIndicatorIcon(directionAngle)}
                                      <span style={{ marginLeft: '4px' }}>{direction}</span>
                      </Typography>
                                  </Box>
                                  
                                  {directionAngle !== undefined && (
                        <Chip 
                                      label={`${Math.round(directionAngle)}°`}
                          size="small" 
                                      sx={{ 
                                        height: 20, 
                                        fontSize: '0.7rem',
                                        backgroundColor: `${style.accentColor}33`,
                                        border: `1px solid ${style.accentColor}44`,
                                        fontWeight: 'bold'
                                      }}
                                    />
                                  )}
                      </Box>
                              )}
                              
                              {/* Confidence */}
                              {alert.confidence && (
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  mt: 1,
                                  gap: 1
                                }}>
                                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                    Confidence:
                                  </Typography>
                                  <Box sx={{ 
                                    flex: 1, 
                                    height: '4px', 
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                  }}>
                                    <Box sx={{ 
                                      width: `${Math.round(alert.confidence * 100)}%`, 
                                      height: '100%',
                                      borderRadius: '2px',
                                      background: alertColor
                                    }} />
                    </Box>
                                  <Typography variant="caption" sx={{ color: alertColor, fontWeight: 'bold' }}>
                                    {Math.round(alert.confidence * 100)}%
                                  </Typography>
              </Box>
                              )}
                              
                              {/* Timestamp */}
                              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 0.5, display: 'block' }}>
                                {formatTimestamp(alert.timestamp || alert.time)}
              </Typography>
                              
                              {/* Decorative element */}
                              {index === 0 && (
                                <Box 
                                  sx={{ 
                                    position: 'absolute', 
                                    top: -20, 
                                    right: -20, 
                                    width: 80, 
                                    height: 80, 
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${alertColor}22 0%, ${alertColor}00 70%)`,
                                    zIndex: 0
                                  }} 
                                />
            )}
          </Paper>
        </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              </MotionBox>
            </Grid>
          )}
          
          {/* Speech Transcription - shown last in spatial mode */}
        <Grid item xs={12}>
            <MotionPaper 
              component={motion.div}
              variants={itemVariants}
              sx={{ 
                p: 2, 
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(255, 87, 34, 0.2) 100%)',
                borderRadius: 2,
                border: '1px solid rgba(255, 87, 34, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              whileHover={{ 
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(255, 87, 34, 0.3) 100%)',
                transition: { duration: 0.3 }
              }}
            >
              <MotionBox
                component={motion.div}
                sx={{
                  position: 'absolute',
                  right: -50,
                  bottom: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255, 87, 34, 0.2) 0%, rgba(255, 87, 34, 0) 70%)'
                }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              
              <Typography 
                variant="subtitle1" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  color: style.primaryColor
                }}
              >
              <MicIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Speech Transcription
            </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress color="primary" size={40} />
                </Box>
              ) : connectionError ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body1" color="error" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ErrorOutlineIcon sx={{ mr: 1 }} /> Connection Error: Could not reach backend service
                  </Typography>
                  <Button 
                    startIcon={<RefreshIcon />}
                    onClick={checkStatus}
                    variant="contained"
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Retry Connection
                  </Button>
                </Box>
              ) : (
                transcriptions.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflow: 'auto', pr: 1 }}>
                    {transcriptions.map((trans, index) => {
                      const isLastItem = index === transcriptions.length - 1;
                      const isEmotionDetected = trans.emotion && trans.emotion !== 'unknown';
                      
                      return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box 
                      sx={{ 
                              mb: 1.5, 
                        p: 1.5, 
                              borderRadius: 2, 
                              background: isEmotionDetected 
                                ? `linear-gradient(to right, rgba(255, 255, 255, 0.03), ${getEmotionColor(trans.emotion)}22)` 
                                : 'rgba(255, 255, 255, 0.03)',
                              border: isEmotionDetected 
                                ? `1px solid ${getEmotionColor(trans.emotion)}66` 
                                : '1px solid rgba(255, 255, 255, 0.1)',
                              boxShadow: isLastItem ? '0 0 15px rgba(255, 87, 34, 0.2)' : 'none',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
                              }
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  opacity: 0.7,
                                  fontStyle: 'italic' 
                                }}
                              >
                                {formatTimestamp(trans.timestamp)}
                        </Typography>
                              
                              {isEmotionDetected && (
                        <Chip 
                          size="small" 
                          label={trans.emotion}
                          sx={{ 
                                    backgroundColor: `${getEmotionColor(trans.emotion)}33`,
                                    borderColor: getEmotionColor(trans.emotion),
                                    color: getEmotionColor(trans.emotion),
                                    border: `1px solid ${getEmotionColor(trans.emotion)}66`,
                                    fontWeight: 'bold',
                            fontSize: '0.7rem',
                                    textTransform: 'capitalize'
                          }}
                        />
                              )}
                      </Box>
                            
                            <Typography 
                              variant="body1" 
                              sx={{ 
                                fontWeight: isLastItem ? 'bold' : 'normal',
                                color: isLastItem ? 'white' : 'rgba(255, 255, 255, 0.9)'
                              }}
                            >
                        {trans.text}
                      </Typography>
                            
                            {isEmotionDetected && !isEmotionFallback(trans) && (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mt: 1, 
                                  fontStyle: 'italic', 
                                  opacity: 0.8,
                                  color: getEmotionColor(trans.emotion)
                                }}
                              >
                                {trans.emotion_explanation}
                        </Typography>
                      )}
                    </Box>
                  </motion.div>
                      );
                    })}
              </Box>
            ) : (
                  <Box 
                    sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      background: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body1" sx={{ opacity: 0.7 }}>
                      {isActive ? 
                        'Listening... No speech detected yet.' : 
                        'Click "Active" to start speech recognition.'
                      }
              </Typography>
                  </Box>
                )
            )}
            </MotionPaper>
        </Grid>
      </Grid>
      </Box>
    </MotionPaper>
  );
};

export default AudioVisualization; 