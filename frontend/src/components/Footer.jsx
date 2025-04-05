import React from 'react';
import { Box, Typography, Container, Link, IconButton, Paper } from '@mui/material';
import { motion } from 'framer-motion';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CodeIcon from '@mui/icons-material/Code';

// Motion components
const MotionBox = motion(Box);
const MotionIconButton = motion(IconButton);
const MotionTypography = motion(Typography);
const MotionPaper = motion(Paper);

// Animation variants
const footerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 100 
    }
  }
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <MotionBox
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={footerVariants}
    >
      <Container maxWidth="lg">
        <MotionPaper
          elevation={0}
          sx={{
            py: 2,
            px: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 4,
            background: 'linear-gradient(160deg, rgba(33, 150, 243, 0.05) 0%, rgba(33, 203, 243, 0.15) 100%)',
          }}
          variants={itemVariants}
          whileHover={{ 
            boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.08)",
            y: -5 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <MotionBox
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: { xs: 'center', sm: 'flex-start' },
              mb: { xs: 2, sm: 0 }
            }}
            variants={itemVariants}
          >
            <MotionTypography 
              variant="body1" 
              color="text.primary"
              sx={{ fontWeight: 'medium' }}
              whileHover={{ scale: 1.02 }}
            >
              RoboMind AI Companion
            </MotionTypography>
            <MotionTypography 
              variant="body2" 
              color="text.secondary"
              whileHover={{ scale: 1.02 }}
            >
              © {currentYear} SF Hacks Team. All rights reserved.
            </MotionTypography>
          </MotionBox>
          
          <MotionBox 
            sx={{ 
              display: 'flex',
              gap: 1
            }}
            variants={itemVariants}
          >
            <MotionIconButton 
              aria-label="GitHub"
              component={Link}
              href="https://github.com"
              target="_blank"
              rel="noopener"
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                transition: { type: "spring", stiffness: 400 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <GitHubIcon />
            </MotionIconButton>
            <MotionIconButton 
              aria-label="LinkedIn"
              component={Link}
              href="https://linkedin.com"
              target="_blank"
              rel="noopener"
              whileHover={{ 
                scale: 1.2, 
                rotate: -5,
                transition: { type: "spring", stiffness: 400 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <LinkedInIcon />
            </MotionIconButton>
            <MotionIconButton 
              aria-label="Source Code"
              component={Link}
              href="https://github.com"
              target="_blank"
              rel="noopener"
              whileHover={{ 
                scale: 1.2, 
                rotate: 5,
                transition: { type: "spring", stiffness: 400 }
              }}
              whileTap={{ scale: 0.9 }}
            >
              <CodeIcon />
            </MotionIconButton>
          </MotionBox>
        </MotionPaper>
      </Container>
    </MotionBox>
  );
};

export default Footer; 