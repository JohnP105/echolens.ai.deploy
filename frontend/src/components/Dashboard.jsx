import React, { useState } from 'react';
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
import { motion, useMotionValue, useTransform } from 'framer-motion';

// Icons
import HearingIcon from '@mui/icons-material/Hearing';
import SurroundSoundIcon from '@mui/icons-material/SurroundSound';
import ChatIcon from '@mui/icons-material/Chat';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';

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
const Tilt3DCard = ({ children, depth = 5 }) => {
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

const Dashboard = ({ emotionalState, darkMode, setActiveTab }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeCard, setActiveCard] = useState(null);

  // Main action cards
  const mainFeatures = [
    { 
      id: 'speech',
      title: 'Speech Recognition', 
      description: 'Transcribe spoken language and detect emotional tone in real-time',
      icon: <HearingIcon fontSize="large" color="primary" />,
      tabIndex: 1,
      color: '#2196f3'
    },
    { 
      id: 'spatial',
      title: 'Sound Detection', 
      description: 'Identify important sounds in your environment and their direction',
      icon: <SurroundSoundIcon fontSize="large" color="primary" />,
      tabIndex: 2,
      color: '#9c27b0'
    },
    { 
      id: 'chat',
      title: 'AI Assistant', 
      description: 'Get support and learn more about your audio environment',
      icon: <ChatIcon fontSize="large" color="primary" />,
      tabIndex: 3,
      color: '#ff5722'
    }
  ];

  return (
    <MotionBox
      component={motion.div}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      sx={{ width: '100%' }}
    >
      {/* Enhanced Hero section */}
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={0}
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 4, 
          borderRadius: 4,
          background: `linear-gradient(135deg, 
            ${theme.palette.primary.dark} 0%, 
            ${theme.palette.primary.main} 40%, 
            ${theme.palette.primary.light} 100%)`,
          color: 'white',
          overflow: 'hidden',
          position: 'relative',
          minHeight: '220px'
        }}
      >
        {/* Dynamic background elements */}
        <MotionBox
          component={motion.div}
          sx={{
            position: 'absolute',
            top: '-10%',
            right: '-5%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
            filter: 'blur(20px)',
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
        
        {/* Animated circles */}
        {[...Array(5)].map((_, i) => (
          <MotionBox
            key={`circle-${i}`}
            component={motion.div}
            sx={{
              position: 'absolute',
              width: 20 + i * 10,
              height: 20 + i * 10,
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              zIndex: 0
            }}
            initial={{ 
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              opacity: 0.3 + Math.random() * 0.4
            }}
            animate={{ 
              x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              y: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              opacity: [0.3 + Math.random() * 0.4, 0.6 + Math.random() * 0.4]
            }}
            transition={{
              duration: 12 + i * 4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Sound wave effect */}
        <MotionBox
          component={motion.div}
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: 0,
            right: 0,
            height: '2px',
            background: 'rgba(255,255,255,0.3)',
            zIndex: 0
          }}
          animate={{
            height: ['2px', '30px', '2px'],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <Grid container spacing={3} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid item xs={12} md={8}>
            <MotionTypography 
              variant="h3" 
              gutterBottom 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                position: 'relative'
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Welcome to{" "}
              <Box 
                component="span" 
                sx={{ 
                  position: 'relative',
                  display: 'inline-block'
                }}
              >
                EchoLens
                <MotionBox 
                  component={motion.div}
                  animate={{ 
                    width: ['0%', '100%', '0%']
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 5
                  }}
                  sx={{
                    position: 'absolute',
                    height: '5px',
                    bottom: 0,
                    left: 0,
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: '2px'
                  }}
                />
              </Box>
              <Box component="span" sx={{ color: theme.palette.secondary.light }}>.AI</Box>
            </MotionTypography>
            
            <MotionTypography 
              variant="h5"
              sx={{ 
                opacity: 0.9, 
                mb: 2,
                fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.5rem' }
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <MotionBox
                component="span"
                animate={{ 
                  color: [
                    theme.palette.secondary.light, 
                    theme.palette.secondary.main, 
                    'white', 
                    theme.palette.secondary.light
                  ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
              >
                Your Sound & Emotion Translator
              </MotionBox>
            </MotionTypography>
            
            <MotionTypography 
              variant="body1" 
              sx={{ 
                mt: 2,
                maxWidth: '90%',
                opacity: 0.9,
                lineHeight: 1.6
              }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              EchoLens.AI uses advanced AI to detect environmental sounds and emotional tones, providing real-time 
              translations for Deaf and hard-of-hearing users. Try both the speech recognition and spatial sound detection features.
            </MotionTypography>
            
            <MotionBox
              sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <MotionButton
                variant="contained"
                color="secondary"
                size="large"
                onClick={() => setActiveTab(1)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{ 
                  borderRadius: '20px',
                  px: 3
                }}
              >
                Start Listening
              </MotionButton>
              
              <MotionButton
                variant="outlined"
                size="large"
                onClick={() => setActiveTab(3)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                sx={{ 
                  borderRadius: '20px',
                  px: 3,
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                AI Assistant
              </MotionButton>
            </MotionBox>
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ 
            textAlign: 'center',
            display: { xs: 'none', sm: 'block' } 
          }}>
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
              whileHover={{ 
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 }
              }}
              sx={{
                position: 'relative',
                zIndex: 1
              }}
            >
              <SmartToyIcon sx={{ 
                fontSize: { xs: 100, sm: 130, md: 160 }, 
                opacity: 0.9,
                filter: 'drop-shadow(0 0 15px rgba(0, 0, 0, 0.3))'
              }} />
              
              {/* Orbit effect around the icon */}
              <MotionBox
                component={motion.div}
                animate={{ rotate: 360 }}
                transition={{ 
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  border: '1px dashed rgba(255,255,255,0.3)',
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <MotionBox
                  component={motion.div}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.secondary.main,
                    transform: 'translateX(-50%)',
                    boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                  }}
                />
              </MotionBox>
            </MotionBox>
          </Grid>
        </Grid>
      </MotionPaper>

      {/* Main features section */}
      <MotionTypography 
        component={motion.div}
        variants={itemVariants}
        variant="h5" 
        gutterBottom 
        sx={{ mt: 4, mb: 3, fontWeight: 'bold' }}
      >
        Main Features
      </MotionTypography>
      <Grid container spacing={3}>
        {mainFeatures.map((feature, index) => (
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
                  overflow: 'hidden',
                  cursor: 'pointer'
                }}
                onClick={() => setActiveTab && setActiveTab(feature.tabIndex)}
                onMouseEnter={() => setActiveCard(feature.id)}
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
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}bb)`
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
                      y: activeCard === feature.id ? [0, -5, 0] : 0
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: activeCard === feature.id ? 1 : 0
                    }}
                  >
                    {feature.icon}
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
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      transform: "translateZ(5px)",
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
                <CardActions sx={{ position: 'relative' }}>
                  <MotionButton 
                    size="small" 
                    color="primary" 
                    onClick={() => setActiveTab && setActiveTab(feature.tabIndex)}
                    sx={{ ml: 1, mb: 1 }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Open
                  </MotionButton>
                </CardActions>
              </MotionCard>
            </Tilt3DCard>
          </Grid>
        ))}
      </Grid>

      {/* About section - simplified */}
      <MotionPaper 
        component={motion.div}
        variants={itemVariants}
        elevation={2} 
        sx={{ p: 3, mt: 4, borderRadius: 2 }}
        whileHover={{ boxShadow: "0px 8px 25px rgba(0, 0, 0, 0.08)" }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">
          About EchoLens.AI
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" paragraph>
          EchoLens.AI is an advanced sound and emotion translator designed to support Deaf and hard-of-hearing users. It uses state-of-the-art AI to analyze audio signals, voice patterns, and provide contextual information about the surrounding environment.
        </Typography>
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
          <Typography variant="body2" fontWeight="medium">
            EchoLens.AI is designed to be fully accessible to Deaf and hard-of-hearing users.
          </Typography>
        </MotionBox>
      </MotionPaper>
    </MotionBox>
  );
};

export default Dashboard; 