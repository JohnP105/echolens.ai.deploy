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
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const ChatInterface = ({ emotionalState }) => {
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

  // Format timestamp
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  // Clear error alert
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box>
      <Typography variant="h2" gutterBottom align="center">
        Chat with RoboMind
      </Typography>
      
      <Typography variant="body1" align="center" gutterBottom color="text.secondary">
        {emotionalState && emotionalState.emotion && emotionalState.emotion !== 'neutral' ? (
          `I sense you're feeling ${emotionalState.emotion}. How can I help?`
        ) : (
          "Share how you're feeling, and I'll do my best to support you."
        )}
      </Typography>
      
      <Paper 
        elevation={3} 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          height: '60vh',
          maxHeight: 'calc(100vh - 250px)',
          mb: 2,
          overflow: 'hidden'
        }}
      >
        {/* Chat messages */}
        <List 
          sx={{ 
            flex: 1, 
            overflow: 'auto',
            bgcolor: 'background.paper',
            p: 2
          }}
        >
          {messages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  textAlign: message.sender === 'user' ? 'right' : 'left',
                  mb: 1
                }}
              >
                {message.sender === 'bot' && (
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SmartToyIcon />
                    </Avatar>
                  </ListItemAvatar>
                )}
                
                <ListItemText
                  primary={
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        display: 'inline-block',
                        maxWidth: '70%',
                        bgcolor: message.sender === 'user' 
                          ? 'primary.light' 
                          : message.isError 
                            ? 'error.light' 
                            : 'grey.100',
                        color: message.sender === 'user' 
                          ? 'primary.contrastText' 
                          : 'text.primary',
                        borderRadius: 2,
                      }}
                    >
                      <Typography variant="body1">
                        {message.text}
                      </Typography>
                      <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
                        {formatTime(message.timestamp)}
                      </Typography>
                    </Paper>
                  }
                />
                
                {message.sender === 'user' && (
                  <ListItemAvatar sx={{ ml: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                )}
              </ListItem>
              {index < messages.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
          
          {isLoading && (
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToyIcon />
                </Avatar>
              </ListItemAvatar>
              <CircularProgress size={24} />
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
        
        {/* Message input */}
        <Box 
          component="form" 
          onSubmit={handleSendMessage}
          sx={{ 
            p: 2, 
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          {speechRecognition && (
            <IconButton 
              color={isRecording ? "secondary" : "default"}
              onClick={toggleRecording}
              sx={{ mr: 1 }}
            >
              {isRecording ? <MicOffIcon /> : <MicIcon />}
            </IconButton>
          )}
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isLoading || isRecording}
            sx={{ mr: 2 }}
          />
          
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isLoading}
          >
            Send
          </Button>
        </Box>
      </Paper>
      
      {/* Error snackbar */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
        <Alert onClose={handleCloseError} severity="warning">
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatInterface; 