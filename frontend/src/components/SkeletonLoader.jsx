import React from 'react';
import { Box, Skeleton, Grid, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const MotionSkeleton = motion(Skeleton);
const MotionBox = motion(Box);

// Dashboard skeleton loader
export const DashboardSkeleton = () => {
  const theme = useTheme();
  
  return (
    <Box>
      {/* Hero section skeleton */}
      <MotionBox
        sx={{
          p: 4,
          mb: 4,
          height: 300,
          borderRadius: 4,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(120deg, #1e3c72 0%, #1e3c72 100%)'
            : 'linear-gradient(120deg, #e0f7fa 0%, #bbdefb 100%)'
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <MotionSkeleton
              variant="text"
              height={60}
              width="70%"
              sx={{ mb: 2 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <MotionSkeleton
              variant="text"
              height={30}
              width="50%"
              sx={{ mb: 2 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <MotionSkeleton
              variant="rectangular"
              height={100}
              width="90%"
              sx={{ borderRadius: 1 }}
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
            <MotionSkeleton
              variant="circular"
              width={150}
              height={150}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </Grid>
        </Grid>
      </MotionBox>
      
      {/* Quick actions skeleton */}
      <MotionSkeleton 
        variant="text" 
        height={40} 
        width={200}
        sx={{ mb: 2 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[1, 2, 3].map((_, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <MotionSkeleton
              variant="rectangular"
              height={200}
              sx={{ borderRadius: 2 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: index * 0.2
              }}
            />
          </Grid>
        ))}
      </Grid>
      
      {/* About section skeleton */}
      <MotionSkeleton
        variant="rectangular"
        height={250}
        sx={{ borderRadius: 2 }}
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </Box>
  );
};

// Chat skeleton loader
export const ChatSkeleton = () => {
  const messageCount = 3;
  
  return (
    <Box sx={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header skeleton */}
      <MotionSkeleton
        variant="rectangular"
        height={60}
        sx={{ borderRadius: 2, mb: 2 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      
      {/* Chat content skeleton */}
      <MotionBox
        sx={{ 
          flexGrow: 1, 
          mb: 2, 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 2,
          borderRadius: 2,
          bgcolor: 'background.paper'
        }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {/* Chat messages */}
        <Box>
          {[...Array(messageCount)].map((_, index) => (
            <Box 
              key={index}
              sx={{ 
                display: 'flex', 
                flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
                mb: 3,
                alignItems: 'flex-start'
              }}
            >
              <MotionSkeleton
                variant="circular"
                width={40}
                height={40}
                sx={{ mr: index % 2 === 0 ? 2 : 0, ml: index % 2 === 0 ? 0 : 2 }}
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  delay: index * 0.1
                }}
              />
              <MotionSkeleton
                variant="rectangular"
                width={`${Math.random() * 30 + 30}%`}
                height={60}
                sx={{ 
                  borderRadius: index % 2 === 0 ? '4px 18px 18px 18px' : '18px 4px 18px 18px'
                }}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  delay: index * 0.15
                }}
              />
            </Box>
          ))}
        </Box>
      </MotionBox>
      
      {/* Chat input skeleton */}
      <MotionSkeleton
        variant="rectangular"
        height={60}
        sx={{ borderRadius: 2 }}
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </Box>
  );
};

// Default export
const SkeletonLoader = ({ type = 'dashboard' }) => {
  if (type === 'chat') return <ChatSkeleton />;
  return <DashboardSkeleton />;
};

export default SkeletonLoader; 