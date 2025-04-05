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
import { motion } from 'framer-motion';

// Icons
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SettingsIcon from '@mui/icons-material/Settings';

// Animated MUI components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionTypography = motion(Typography);

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.3 }
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

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: { 
    duration: 2, 
    repeat: Infinity,
    repeatType: "reverse" 
  }
};

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
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 4, 
          borderRadius: 4,
          background: 'linear-gradient(120deg, #2196f3 0%, #21cbf3 100%)',
          color: 'white',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <MotionBox
          component={motion.div}
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
          }}
          animate={{
            x: [0, 10, 0],
            y: [0, 15, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <MotionTypography 
              variant="h3" 
              gutterBottom 
              fontWeight="bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Welcome to RoboMind
            </MotionTypography>
            <MotionTypography 
              variant="h5"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Your Emotion-Aware Companion Robot
            </MotionTypography>
            <MotionTypography 
              variant="body1" 
              sx={{ mt: 2 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              RoboMind uses AI to detect your emotional state and provides mental health support tailored to your needs.
              Start by trying out the emotion analysis with your webcam or simply chat with the robot.
            </MotionTypography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <MotionBox
              component={motion.div}
              animate={pulseAnimation}
            >
              <SmartToyIcon sx={{ fontSize: 160, opacity: 0.9 }} />
            </MotionBox>
          </Grid>
        </Grid>
      </MotionPaper>

      {/* Current emotional state */}
      {emotionalState && emotionalState.emotion !== 'neutral' && (
        <MotionPaper 
          component={motion.div}
          variants={itemVariants}
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'primary.light',
            bgcolor: 'background.paper'
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
          <MotionBox
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/chat')}
            >
              Get Support
            </Button>
          </MotionBox>
        </MotionPaper>
      )}

      {/* Quick actions */}
      <MotionTypography 
        component={motion.div}
        variants={itemVariants}
        variant="h4" 
        gutterBottom 
        sx={{ mt: 4, mb: 3 }}
      >
        Quick Actions
      </MotionTypography>
      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <MotionCard 
              component={motion.div}
              variants={itemVariants}
              elevation={2} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
              }}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.1)"
              }}
              whileTap={{ scale: 0.98 }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <MotionBox 
                  sx={{ textAlign: 'center', mb: 2 }}
                  whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {action.icon}
                </MotionBox>
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
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* About section */}
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={2} 
        sx={{ p: 3, mt: 4, borderRadius: 2 }}
        whileHover={{ boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.08)" }}
      >
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
        <MotionBox 
          component={motion.div}
          sx={{ display: 'flex', alignItems: 'center', mt: 2 }}
          initial={{ opacity: 0.8 }}
          whileHover={{ 
            opacity: 1,
            x: 5,
            transition: { duration: 0.2 }
          }}
        >
          <AccessibilityNewIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2" color="text.secondary">
            RoboMind is designed to be accessible to users of all abilities.
          </Typography>
        </MotionBox>
      </MotionPaper>
    </MotionBox>
  );
};

export default Dashboard; 