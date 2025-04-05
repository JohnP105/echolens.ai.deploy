import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  IconButton,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import { motion, AnimatePresence } from 'framer-motion';

// Motion components
const MotionBox = motion(Box);
const MotionPaper = motion(Paper);
const MotionListItem = motion(ListItem);
const MotionIconButton = motion(IconButton);
const MotionTypography = motion(Typography);

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

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 500 } },
  exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { duration: 1.5, repeat: Infinity }
};

const ChatInterface = ({ emotionalState }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm RoboMind, your AI companion. How are you feeling today?", 
      sender: 'bot',
      timestamp: new Date() 
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // Speech recognition setup (if available)
  const [speechRecognition, setSpeechRecognition] = useState(null);

  useEffect(() => {
    // Initialize speech recognition if browser supports it
    if (window.webkitSpeechRecognition || window.SpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(transcript);
        setIsRecording(false);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsRecording(false);
      };
      
      setSpeechRecognition(recognition);
    }
  }, []);

  // Scroll to the bottom of the chat when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input field on load
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Toggle voice recording
  const toggleRecording = () => {
    if (!speechRecognition) return;
    
    if (isRecording) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
      setIsRecording(true);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    
    if (!newMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    try {
      // Prepare emotional context if available
      let context = {};
      if (emotionalState && emotionalState.emotion) {
        context = {
          emotion: emotionalState.emotion,
          intensity: emotionalState.intensity || 'medium',
          sentiment: emotionalState.sentiment || (emotionalState.emotion === 'happy' ? 'positive' : 'negative')
        };
      }
      
      // Call the backend API for response
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userMessage.text,
          context: context
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Add bot response to chat
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now(),
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    } catch (error) {
      console.error('Error sending message to API:', error);
      setError('Failed to get response. Falling back to local processing.');
      
      // Fallback to local processing if API fails
      const botResponse = getBotResponse(userMessage.text, emotionalState);
      setMessages(prev => [
        ...prev, 
        {
          id: Date.now(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
          isError: true
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Get a response based on user message and emotional state
  const getBotResponse = (message, emotionalState) => {
    const lowerMsg = message.toLowerCase();
    
    // Check for greetings
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello there! How are you feeling today?";
    }
    
    // Check for emotional states
    if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('unhappy')) {
      return "I'm sorry to hear you're feeling down. Remember that these feelings are temporary. Would you like to talk about what's causing these feelings?";
    }
    
    if (lowerMsg.includes('happy') || lowerMsg.includes('good') || lowerMsg.includes('great')) {
      return "I'm glad you're feeling good! What's been going well for you lately?";
    }
    
    if (lowerMsg.includes('angry') || lowerMsg.includes('mad') || lowerMsg.includes('upset')) {
      return "I understand you're feeling frustrated. Taking deep breaths can help calm your nervous system. Would you like to try a quick breathing exercise?";
    }
    
    if (lowerMsg.includes('worried') || lowerMsg.includes('anxious') || lowerMsg.includes('stress')) {
      return "Anxiety can be challenging. Let's try to break down what's causing your worry. Is there a specific situation that's making you feel this way?";
    }
    
    // Check for questions about the robot
    if (lowerMsg.includes('who are you') || lowerMsg.includes('what are you')) {
      return "I'm RoboMind, an AI companion designed to support mental health through emotional awareness and conversation. I'm here to listen and help whenever you need me.";
    }
    
    // Check for help requests
    if (lowerMsg.includes('help') || lowerMsg.includes('suggestion') || lowerMsg.includes('advice')) {
      return "I'd be happy to help. To support your mental wellbeing, consider practices like mindfulness meditation, physical exercise, connecting with loved ones, or journaling. Would you like more specific suggestions?";
    }
    
    // Use emotional state for contextual responses if available
    if (emotionalState && emotionalState.emotion && emotionalState.emotion !== 'neutral') {
      if (emotionalState.emotion === 'happy') {
        return "It's wonderful to see you happy! Savoring positive emotions can help them last longer. What's bringing you joy right now?";
      } else if (emotionalState.emotion === 'sad') {
        return "I notice you might be feeling sad. Sometimes talking about our feelings can help process them. Would you like to share what's on your mind?";
      } else if (emotionalState.emotion === 'angry') {
        return "I sense you might be feeling frustrated. Taking a moment to ground yourself can be helpful. Would you like to try a quick grounding exercise?";
      }
    }
    
    // Default responses
    const defaultResponses = [
      "Tell me more about how you're feeling.",
      "I'm here to support you. How can I help right now?",
      "Thank you for sharing that with me. How long have you been feeling this way?",
      "I appreciate you opening up. What do you think might help in this situation?",
      "I'm listening. Would you like to explore some coping strategies together?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  // Format time for message timestamps
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Close error snackbar
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      sx={{
        height: '80vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Chat header */}
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={2} 
        sx={{ 
          p: 2, 
          mb: 2, 
          display: 'flex', 
          alignItems: 'center',
          background: 'linear-gradient(90deg, #2196f3 0%, #21CBF3 100%)',
          color: 'white',
          borderRadius: '12px'
        }}
      >
        <MotionBox
          animate={{
            rotate: [0, 10, 0, -10, 0],
            transition: { duration: 3, repeat: Infinity }
          }}
          sx={{ mr: 2 }}
        >
          <SmartToyIcon sx={{ fontSize: 32 }} />
        </MotionBox>
        <Box>
          <MotionTypography variant="h6" fontWeight="bold">
            Chat with RoboMind
          </MotionTypography>
          <MotionTypography variant="caption">
            Your AI Mental Health Companion
          </MotionTypography>
        </Box>
        {emotionalState && emotionalState.emotion !== 'neutral' && (
          <MotionBox 
            sx={{ ml: 'auto', mr: 1 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Typography variant="body2">
              Current Emotion: <strong>{emotionalState.emotion}</strong>
            </Typography>
          </MotionBox>
        )}
      </MotionPaper>

      {/* Chat messages */}
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={3} 
        sx={{ 
          p: 2, 
          flexGrow: 1, 
          overflowY: 'auto',
          borderRadius: '12px',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <List sx={{ width: '100%', flexGrow: 1 }}>
          <AnimatePresence>
            {messages.map((message) => (
              <MotionListItem
                key={message.id}
                component={motion.li}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                sx={{ 
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                  mb: 1
                }}
              >
                <ListItemAvatar sx={{ minWidth: '45px' }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: message.sender === 'bot' 
                        ? 'primary.main' 
                        : 'secondary.main',
                      width: 38, 
                      height: 38
                    }}
                  >
                    {message.sender === 'bot' ? <SmartToyIcon /> : <PersonIcon />}
                  </Avatar>
                </ListItemAvatar>
                <MotionPaper
                  sx={{
                    p: 1.5,
                    px: 2,
                    maxWidth: '70%',
                    borderRadius: message.sender === 'user' 
                      ? '18px 4px 18px 18px' 
                      : '4px 18px 18px 18px',
                    bgcolor: message.sender === 'user' 
                      ? 'secondary.light' 
                      : message.isError 
                        ? '#FFF3F3' 
                        : 'primary.light',
                    color: message.sender === 'user' 
                      ? 'white' 
                      : 'text.primary',
                    boxShadow: 1
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <ListItemText 
                    primary={message.text} 
                    secondary={formatTime(message.timestamp)}
                    primaryTypographyProps={{
                      variant: 'body1',
                      sx: { wordBreak: 'break-word' }
                    }}
                    secondaryTypographyProps={{
                      align: 'right',
                      variant: 'caption',
                      sx: { 
                        mt: 0.5, 
                        opacity: 0.7,
                        color: message.sender === 'user' ? 'white' : 'inherit'
                      }
                    }}
                  />
                </MotionPaper>
              </MotionListItem>
            ))}
          </AnimatePresence>
          
          {/* Show typing animation when loading */}
          {isLoading && (
            <MotionListItem
              component={motion.li}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              sx={{ alignItems: 'flex-start' }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              </ListItemAvatar>
              <MotionPaper
                animate={pulseAnimation}
                sx={{
                  p: 2,
                  px: 3,
                  borderRadius: '4px 18px 18px 18px',
                  bgcolor: 'primary.light',
                  display: 'flex',
                  gap: 1
                }}
              >
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.6 }}/>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.8 }}/>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }}/>
              </MotionPaper>
            </MotionListItem>
          )}

          <div ref={messagesEndRef} />
        </List>
      </MotionPaper>

      {/* Message input */}
      <MotionPaper 
        component="form"
        variants={itemVariants}
        onSubmit={handleSendMessage}
        elevation={3} 
        sx={{ 
          p: 2, 
          mt: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderRadius: '12px',
          bgcolor: 'background.paper'
        }}
      >
        <TextField
          inputRef={inputRef}
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ 
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              backgroundColor: theme.palette.background.default
            }
          }}
        />
        {speechRecognition && (
          <MotionIconButton 
            color={isRecording ? 'secondary' : 'primary'} 
            onClick={toggleRecording}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={isRecording ? { scale: [1, 1.1, 1], transition: { repeat: Infinity, duration: 1 } } : {}}
          >
            {isRecording ? <MicOffIcon /> : <MicIcon />}
          </MotionIconButton>
        )}
        <MotionIconButton 
          color="primary" 
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          sx={{ ml: 1 }}
        >
          <SendIcon />
        </MotionIconButton>
      </MotionPaper>

      {/* Error notification */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="warning" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </MotionBox>
  );
};

export default ChatInterface; 