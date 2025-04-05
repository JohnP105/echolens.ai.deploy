import React from 'react';
import { Box, Typography, Container, Link, Divider } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[100],
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mb: { xs: 2, sm: 0 } }}
          >
            {'Created with '}
            <FavoriteIcon fontSize="small" color="error" sx={{ verticalAlign: 'middle' }} />
            {' for SF Hacks & OpenMind Hackathon'}
          </Typography>
          
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center', 
              '& > :not(:first-of-type)': { 
                ml: { xs: 0, sm: 2 },
                mt: { xs: 1, sm: 0 } 
              } 
            }}
          >
            <Link
              color="primary"
              href="https://github.com/OpenmindAGI/OM1"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              OM1 SDK
            </Link>
            
            <Link
              color="primary"
              href="https://ai.google.dev/docs/gemini_api_overview"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              Gemini API
            </Link>
            
            <Typography variant="body2" color="text.secondary">
              © {new Date().getFullYear()} RoboMind
            </Typography>
          </Box>
        </Box>
        
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mt: 2 }}
        >
          RoboMind is designed to provide general mental health information and support, not to replace professional mental health services. 
          If you're experiencing severe distress, please contact a mental health professional.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer; 