import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Icons
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SettingsIcon from '@mui/icons-material/Settings';

const Dashboard = ({ emotionalState }) => {
  const navigate = useNavigate();

  // Quick actions
  const quickActions = [
    { 
      title: 'Emotion Analysis', 
      description: 'Analyze your facial expressions and emotions in real-time using your webcam',
      icon: <VideocamIcon fontSize="large" color="primary" />,
      action: () => navigate('/analysis')
    },
    { 
      title: 'Chat with RoboMind', 
      description: 'Have a conversation about how you\'re feeling today',
      icon: <ChatIcon fontSize="large" color="primary" />,
      action: () => navigate('/chat')
    },
    { 
      title: 'Robot Settings', 
      description: 'Configure hardware settings, language options, and accessibility features',
      icon: <SettingsIcon fontSize="large" color="primary" />,
      action: () => navigate('/settings')
    },
  ];

  return (
    <Box>
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: 'linear-gradient(120deg, #2196f3 0%, #21cbf3 100%)',
          color: 'white'
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h3" gutterBottom fontWeight="bold">
              Welcome to RoboMind
            </Typography>
            <Typography variant="h5">
              Your Emotion-Aware Companion Robot
            </Typography>
            <Typography variant="body1" sx={{ mt: 2 }}>
              RoboMind uses AI to detect your emotional state and provides mental health support tailored to your needs.
              Start by trying out the emotion analysis with your webcam or simply chat with the robot.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <SmartToyIcon sx={{ fontSize: 160, opacity: 0.9 }} />
          </Grid>
        </Grid>
      </Paper>

      {/* Current emotional state */}
      {emotionalState && emotionalState.emotion !== 'neutral' && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.light',
            bgcolor: 'background.paper'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Current Emotional State
          </Typography>
          <Typography variant="body1">
            I've detected that you might be feeling <strong>{emotionalState.emotion}</strong> with a {emotionalState.intensity} intensity.
            {emotionalState.emotion === 'happy' ? 
              " That's wonderful! Would you like to explore activities that can sustain this positive feeling?" :
              " Would you like some suggestions to help with this emotion?"}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/chat')}
          >
            Get Support
          </Button>
        </Paper>
      )}

      {/* Quick actions */}
      <Typography variant="h4" gutterBottom sx={{ mt: 4, mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={action.action}
                  sx={{ ml: 1, mb: 1 }}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* About section */}
      <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 2 }}>
        <Typography variant="h5" gutterBottom>
          About RoboMind
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" paragraph>
              RoboMind is an AI-powered companion designed to support your mental health through emotion recognition and compassionate conversation. 
            </Typography>
            <Typography variant="body1" paragraph>
              Using advanced technology like the OM1 SDK and Gemini API, RoboMind can analyze facial expressions, voice patterns, and text to understand how you're feeling.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body1" paragraph>
              We're committed to accessibility and inclusion, with features for users of diverse abilities and backgrounds, including voice control and multilingual support.
            </Typography>
            <Typography variant="body1">
              <strong>Note:</strong> While RoboMind provides helpful support, it's not a replacement for professional mental health services. If you're experiencing severe distress, please contact a qualified professional.
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <AccessibilityNewIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            RoboMind is designed to be accessible to users of all abilities.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Dashboard; 