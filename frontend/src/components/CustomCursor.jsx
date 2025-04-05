import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CustomCursor = ({ darkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [cursorType, setCursorType] = useState('default'); // default, pointer, text, button
  
  // Mouse position
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  
  // Add spring physics for smooth cursor movement
  const springConfig = { damping: 25, stiffness: 700 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);
  
  // Track mouse position
  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);
    };
    
    const handleMouseLeave = () => {
      setIsVisible(false);
    };
    
    const handleMouseEnter = () => {
      setIsVisible(true);
    };
    
    // Track cursor interactions with elements
    const handleCursorType = () => {
      const handleElementMouseEnter = (e) => {
        const target = e.currentTarget;
        
        // Handle different element types to change cursor appearance
        if (target.tagName === 'BUTTON' || 
            target.tagName === 'A' || 
            target.getAttribute('role') === 'button') {
          setCursorType('button');
        } else if (target.tagName === 'INPUT' || 
                  target.tagName === 'TEXTAREA' || 
                  target.getAttribute('contenteditable') === 'true') {
          setCursorType('text');
        } else if (target.classList.contains('hoverable')) {
          setCursorType('pointer');
        } else {
          setCursorType('default');
        }
      };
      
      const handleElementMouseLeave = () => {
        setCursorType('default');
      };
      
      // Add event listeners to interactive elements
      const interactiveElements = document.querySelectorAll(
        'a, button, input, textarea, [role="button"], [contenteditable="true"], .hoverable'
      );
      
      interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', handleElementMouseEnter);
        element.addEventListener('mouseleave', handleElementMouseLeave);
      });
      
      // Cleanup function
      return () => {
        interactiveElements.forEach(element => {
          element.removeEventListener('mouseenter', handleElementMouseEnter);
          element.removeEventListener('mouseleave', handleElementMouseLeave);
        });
      };
    };
    
    // Initial setup
    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    
    // Set up interactive elements and cleanup
    const cleanup = handleCursorType();
    
    return () => {
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cleanup();
    };
  }, [cursorX, cursorY]);
  
  // Don't render if not visible or on touch devices
  if (!isVisible || window.matchMedia('(pointer: coarse)').matches) return null;
  
  // Cursor styling based on type and theme
  const getCursorStyles = () => {
    const baseSize = 24;
    const baseBorder = '2px solid';
    const baseColor = darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 150, 243, 0.7)';
    const baseBgColor = darkMode ? 'rgba(18, 18, 18, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    
    switch (cursorType) {
      case 'button':
        return {
          width: baseSize * 1.5,
          height: baseSize * 1.5,
          border: baseBorder,
          borderColor: baseColor,
          backgroundColor: 'transparent',
          mixBlendMode: darkMode ? 'difference' : 'normal',
          scale: 1.2
        };
        
      case 'text':
        return {
          width: 4,
          height: baseSize * 1.2,
          borderColor: 'transparent',
          backgroundColor: baseColor,
          mixBlendMode: 'normal',
          scale: 1
        };
        
      case 'pointer':
        return {
          width: baseSize * 1.2,
          height: baseSize * 1.2,
          border: `${baseBorder} ${baseColor}`,
          backgroundColor: baseBgColor,
          mixBlendMode: 'normal',
          scale: 1.1
        };
        
      default:
        return {
          width: baseSize,
          height: baseSize,
          border: `${baseBorder} ${baseColor}`,
          backgroundColor: 'transparent',
          mixBlendMode: 'normal',
          scale: 1
        };
    }
  };
  
  const cursorStyles = getCursorStyles();
  
  return (
    <>
      {/* Cursor */}
      <Box
        component={motion.div}
        style={{
          left: cursorXSpring,
          top: cursorYSpring
        }}
        animate={{
          ...cursorStyles,
          transition: { type: 'spring', damping: 30, stiffness: 200 }
        }}
        sx={{
          position: 'fixed',
          zIndex: 9999,
          pointerEvents: 'none',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'width 0.2s, height 0.2s, background-color 0.2s, border-color 0.2s',
        }}
      />
      
      {/* Cursor dot */}
      <Box
        component={motion.div}
        style={{
          left: cursorX,
          top: cursorY
        }}
        sx={{
          position: 'fixed',
          zIndex: 10000,
          pointerEvents: 'none',
          width: 6,
          height: 6,
          backgroundColor: darkMode ? '#fff' : '#2196f3',
          borderRadius: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  );
};

export default CustomCursor; 