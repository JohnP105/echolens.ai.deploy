import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  useTheme
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';

// Icons
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

// Animated MUI components
const MotionPaper = motion(Paper);
const MotionBox = motion(Box);
const MotionCard = motion(Card);
const MotionTypography = motion(Typography);
const MotionButton = motion(Button);

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

// 3D Card component with tilt effect
const Tilt3DCard = ({ children, depth = 5, className }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transform mouse movement to rotation
  const rotateX = useTransform(y, [-100, 100], [depth, -depth]);
  const rotateY = useTransform(x, [-100, 100], [-depth, depth]);
  
  const handleMouseMove = (e) => {
    // Get position of mouse relative to card
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Calculate distance from center (adjusted for sensitivity)
    x.set((e.clientX - centerX) / 4);
    y.set((e.clientY - centerY) / 4);
  };
  
  const handleMouseLeave = () => {
    // Reset to original position with a spring animation
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
        width: "100%",
        height: "100%"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          width: "100%",
          height: "100%"
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 300
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

const Dashboard = ({ emotionalState, darkMode }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeCard, setActiveCard] = useState(null);

  // Quick actions
  const quickActions = [
    { 
      id: 'emotion',
      title: 'Emotion Analysis', 
      description: 'Analyze your facial expressions and emotions in real-time using your webcam',
      icon: <VideocamIcon fontSize="large" color="primary" />,
      action: () => navigate('/analysis'),
      color: '#2196f3'
    },
    { 
      id: 'chat',
      title: 'Chat with RoboMind', 
      description: 'Have a conversation about how you\'re feeling today',
      icon: <ChatIcon fontSize="large" color="primary" />,
      action: () => navigate('/chat'),
      color: '#00bcd4'
    },
    { 
      id: 'settings',
      title: 'Robot Settings', 
      description: 'Configure hardware settings, language options, and accessibility features',
      icon: <SettingsIcon fontSize="large" color="primary" />,
      action: () => navigate('/settings'),
      color: '#9c27b0'
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

            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              sx={{ mt: 3 }}
            >
              <MotionButton
                variant="contained"
                color="secondary"
                size="large"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/analysis')}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.2)"
                }}
                whileTap={{ scale: 0.95 }}
                sx={{ 
                  borderRadius: '50px',
                  px: 3,
                  backgroundColor: 'white',
                  color: '#2196f3',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
              >
                Get Started
              </MotionButton>
            </MotionBox>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            <MotionBox
              component={motion.div}
              animate={pulseAnimation}
              drag
              dragConstraints={{
                top: -10,
                left: -10,
                right: 10,
                bottom: 10,
              }}
              dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
            >
              <SmartToyIcon sx={{ 
                fontSize: 160, 
                opacity: 0.9,
                filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
              }} />
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
            bgcolor: 'background.paper',
            position: 'relative',
            overflow: 'hidden'
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <MotionBox
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #2196f3, #21cbf3)'
            }}
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        
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
            <Tilt3DCard>
              <MotionCard 
                component={motion.div}
                variants={itemVariants}
                elevation={2} 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transformStyle: "preserve-3d",
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={() => setActiveCard(action.id)}
                onMouseLeave={() => setActiveCard(null)}
                whileHover={{ 
                  boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.15)"
                }}
                whileTap={{ scale: 0.98 }}
              >
                <MotionBox
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '5px',
                    background: `linear-gradient(90deg, ${action.color}, ${action.color}bb)`
                  }}
                />
                <CardContent sx={{ flexGrow: 1, position: 'relative' }}>
                  <MotionBox 
                    sx={{
                      textAlign: 'center',
                      mb: 2,
                      transformStyle: "preserve-3d",
                      transform: "translateZ(20px)",
                    }}
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    animate={{
                      y: activeCard === action.id ? [0, -5, 0] : 0
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: activeCard === action.id ? 1 : 0
                    }}
                  >
                    {action.icon}
                  </MotionBox>
                  <Typography 
                    variant="h6" 
                    component="h2" 
                    gutterBottom
                    sx={{
                      transform: "translateZ(10px)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      transform: "translateZ(5px)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {action.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ position: 'relative' }}>
                  <MotionButton 
                    size="small" 
                    color="primary" 
                    onClick={action.action}
                    sx={{ ml: 1, mb: 1 }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Open
                  </MotionButton>
                </CardActions>

                <AnimatePresence>
                  {activeCard === action.id && (
                    <MotionBox
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.07 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      sx={{
                        position: 'absolute',
                        top: -50,
                        right: -50,
                        width: 150,
                        height: 150,
                        borderRadius: '50%',
                        background: action.color,
                        zIndex: 0
                      }}
                    />
                  )}
                </AnimatePresence>
              </MotionCard>
            </Tilt3DCard>
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