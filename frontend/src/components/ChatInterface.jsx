import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField,
  IconButton,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  CircularProgress,
  Tooltip,
  Chip,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  Button
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import MoodIcon from '@mui/icons-material/Mood';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../utils/API';
import dataStorage, { saveData, loadData, exportToJsonFile, clearData } from '../utils/dataStorage';
import { API_BASE_URL } from '../config';

// Use STORAGE_KEYS from the imported module
const { STORAGE_KEYS } = dataStorage;

// Motion components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionListItem = motion(ListItem);

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
    transition: { type: 'spring', stiffness: 300, damping: 30 }
  }
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

const ChatInterface = ({ darkMode, emotionalState }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm EchoLens.AI, your emotion and sound aware assistant. How can I help you today?", sender: 'bot', emotion: 'neutral', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [apiStatus, setApiStatus] = useState({ status: 'checking', gemini_api: 'checking' });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Load saved messages on component mount
  useEffect(() => {
    const savedMessages = loadData(STORAGE_KEYS.CHAT_HISTORY, []);
    if (savedMessages && savedMessages.length > 0) {
      // Convert timestamp strings back to Date objects
      const processedMessages = savedMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(processedMessages);
    }
  }, []);
  
  // Save messages whenever they change
  useEffect(() => {
    if (messages.length > 1) {  // Don't save just the welcome message
      saveData(STORAGE_KEYS.CHAT_HISTORY, messages);
    }
  }, [messages]);
  
  // Check API status on component mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const status = await API.getStatus();
        setApiStatus(status);
      } catch (err) {
        console.error('Error checking API status:', err);
        setApiStatus({ status: 'offline', gemini_api: 'disconnected' });
        setError('Unable to connect to EchoLens.AI API');
      }
    };
    
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleInputChange = (e) => {
    setInput(e.target.value);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Check if API is online
    if (apiStatus.status !== 'online' || apiStatus.gemini_api !== 'connected') {
      setError('Unable to send message: API is offline');
      return;
    }
    
    const userMessage = {
      id: messages.length + 1,
      text: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // First analyze the text for emotion
      const emotionAnalysis = await API.analyzeText(input.trim());
      
      // Update user message with emotion
      setMessages(prev => prev.map(msg => 
        msg.id === userMessage.id 
          ? { ...msg, emotion: emotionAnalysis.emotion }
          : msg
      ));
      
      // Call the backend API for response
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: input.trim(),
          context: {
            emotion: emotionAnalysis.emotion || 'neutral',
            intensity: 'medium'
          }
        })
      });
      
      const data = await response.json();
      
      // Add bot response
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: data.response,
        sender: 'bot',
        emotion: 'neutral', // Bot responses don't have emotions by default
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error('Error processing message:', err);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "I'm sorry, I'm having trouble processing your message right now.",
        sender: 'bot',
        isError: true,
        timestamp: new Date()
      }]);
      setError(err.message || 'Failed to process message');
    } finally {
      setIsTyping(false);
    }
  };
  
  const handleExportChat = () => {
    // Create a formatted chat history with metadata
    const chatExport = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalMessages: messages.length,
        conversationStart: messages[0]?.timestamp?.toISOString(),
        conversationEnd: messages[messages.length-1]?.timestamp?.toISOString()
      },
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp?.toISOString()
      }))
    };
    
    // Export to JSON file
    exportToJsonFile(chatExport, 'echolens_chat_history.json');
  };
  
  const handleClearChat = () => {
    // Only keep the welcome message
    const welcomeMessage = {
      id: 1, 
      text: "Hello! I'm EchoLens.AI, your emotion and sound aware assistant. How can I help you today?", 
      sender: 'bot', 
      emotion: 'neutral', 
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    clearData(STORAGE_KEYS.CHAT_HISTORY);
  };
  
  // Get background color for message bubble
  const getMessageBackground = (message) => {
    if (message.isError) return theme.palette.error.light;
    if (message.sender === 'bot') return theme.palette.primary.light;
    
    // If user message has emotion, use a gradient with the emotion color
    if (message.emotion && emotionColors[message.emotion]) {
      return `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${emotionColors[message.emotion]} 100%)`;
    }
    
    return theme.palette.background.paper;
  };
  
  // Get text color for message
  const getMessageColor = (message) => {
    if (message.isError) return '#FFFFFF';
    if (message.sender === 'bot') return '#FFFFFF';
    
    // For user messages with strong emotions, use white text
    const strongEmotions = ['angry', 'excited', 'happy'];
    if (message.emotion && strongEmotions.includes(message.emotion)) {
      return '#FFFFFF';
    }
    
    return theme.palette.text.primary;
  };
  
  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 180px)',
        maxHeight: 'calc(100vh - 180px)',
        borderRadius: 4,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Paper 
        elevation={2}
        sx={{
          p: 2,
          borderRadius: '16px 16px 0 0',
          background: 'linear-gradient(90deg, #1976d2 0%, #4fc3f7 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ 
              bgcolor: '#FFFFFF',
              mr: 2
            }}
          >
            <SmartToyIcon color="primary" />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 'bold' }}>
              EchoLens Chat
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              AI-powered with emotion recognition
            </Typography>
          </Box>
        </Box>
        
        <Box>
          <Tooltip title="Clear chat history">
            <IconButton 
              color="inherit" 
              onClick={handleClearChat}
              disabled={messages.length <= 1}
              sx={{ mr: 1 }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Export chat history to JSON">
            <IconButton 
              color="inherit" 
              onClick={handleExportChat}
              disabled={messages.length <= 1}
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Chip 
            size="small"
            label={`${apiStatus.status === 'online' ? 'Online' : 'Offline'}`}
            color={apiStatus.status === 'online' ? 'success' : 'error'}
            sx={{ ml: 1 }}
          />
        </Box>
      </Paper>

      {/* Messages Container */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundImage: darkMode 
            ? 'linear-gradient(rgba(0, 0, 0, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.8) 1px, transparent 1px)'
            : 'linear-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <List sx={{ width: '100%' }}>
          <AnimatePresence>
            {messages.map(message => (
              <MotionListItem
                key={message.id}
                variants={itemVariants}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  p: 1
                }}
                disableGutters
                disablePadding
              >
                <Box
                  sx={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: 1
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: message.sender === 'user' 
                        ? theme.palette.secondary.main 
                        : theme.palette.primary.main
                    }}
                  >
                    {message.sender === 'user' 
                      ? <PersonIcon /> 
                      : message.isError 
                        ? <ErrorOutlineIcon /> 
                        : <SmartToyIcon />
                    }
                  </Avatar>
                  
                  <Box>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 2,
                        borderRadius: message.sender === 'user' 
                          ? '20px 20px 0px 20px' 
                          : '20px 20px 20px 0px',
                        background: getMessageBackground(message),
                        position: 'relative',
                        maxWidth: '100%'
                      }}
                    >
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: getMessageColor(message),
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {message.text}
                      </Typography>
                      
                      {/* Show emotion chip for user messages */}
                      {message.sender === 'user' && message.emotion && (
                        <Chip
                          size="small"
                          icon={<MoodIcon fontSize="small" />}
                          label={message.emotion}
                          sx={{
                            position: 'absolute',
                            top: -12,
                            right: 12,
                            background: emotionColors[message.emotion],
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }}
                        />
                      )}
                    </Paper>
                    
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        pl: message.sender === 'user' ? 0 : 1,
                        pr: message.sender === 'user' ? 1 : 0,
                        textAlign: message.sender === 'user' ? 'right' : 'left',
                        display: 'block',
                        mt: 0.5
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Typography>
                  </Box>
                </Box>
              </MotionListItem>
            ))}
          </AnimatePresence>
          
          {/* Typing indicator */}
          {isTyping && (
            <ListItem
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                p: 1
              }}
              disableGutters
              disablePadding
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                  <SmartToyIcon />
                </Avatar>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: '20px 20px 20px 0px',
                    background: theme.palette.primary.light,
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: 80
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MotionBox
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.1 }}
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FFFFFF' }}
                    />
                    <MotionBox
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.2, delay: 0.1 }}
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FFFFFF' }}
                    />
                    <MotionBox
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3, delay: 0.2 }}
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FFFFFF' }}
                    />
                  </Box>
                </Paper>
              </Box>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Paper>

      {/* Input Container */}
      <Paper
        elevation={3}
        component="form"
        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
        sx={{
          p: 2,
          borderRadius: '0 0 16px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          disabled={apiStatus.status !== 'online' || apiStatus.gemini_api !== 'connected'}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)'
            }
          }}
          InputProps={{
            endAdornment: apiStatus.status !== 'online' || apiStatus.gemini_api !== 'connected' 
              ? <Tooltip title="API is currently offline">
                  <ErrorOutlineIcon color="error" sx={{ mx: 1 }} />
                </Tooltip>
              : null
          }}
        />
        <IconButton 
          color="primary"
          onClick={handleSendMessage}
          disabled={!input.trim() || apiStatus.status !== 'online' || apiStatus.gemini_api !== 'connected'}
          sx={{ 
            p: 2,
            bgcolor: theme.palette.primary.main,
            color: '#FFFFFF',
            '&:hover': {
              bgcolor: theme.palette.primary.dark
            },
            '&.Mui-disabled': {
              bgcolor: theme.palette.action.disabledBackground,
              color: theme.palette.action.disabled
            }
          }}
        >
          <SendIcon />
        </IconButton>
      </Paper>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </MotionBox>
  );
};

export default ChatInterface; 