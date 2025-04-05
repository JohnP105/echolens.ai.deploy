import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';

const ConfettiEffect = ({ active, duration = 3000 }) => {
  const canvasRef = useRef(null);
  const [isActive, setIsActive] = useState(active);
  const animationRef = useRef(null);
  const confettiRef = useRef([]);
  
  // Effect to handle prop changes
  useEffect(() => {
    if (active) {
      setIsActive(true);
      setTimeout(() => setIsActive(false), duration);
    }
  }, [active, duration]);
  
  // Effect for confetti animation
  useEffect(() => {
    if (!isActive || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create confetti particles
    const createConfetti = () => {
      const particles = [];
      const particleCount = 150;
      const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7', 
        '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', 
        '#009688', '#4caf50', '#8bc34a', '#cddc39', 
        '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
      ];
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 10 + 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          speed: Math.random() * 3 + 2,
          rotationSpeed: (Math.random() - 0.5) * 10,
          oscillationSpeed: Math.random() * 2,
          angle: Math.random() * Math.PI * 2,
          angularVel: Math.random() * 0.2 - 0.1,
          density: (Math.random() * 20) + 10
        });
      }
      
      return particles;
    };
    
    // Initialize confetti
    confettiRef.current = createConfetti();
    
    // Draw a single confetti
    const drawConfetti = (p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      
      // Draw shapes randomly
      const shape = Math.floor(Math.random() * 3);
      
      if (shape === 0) {
        // Rectangle
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size / 2);
      } else if (shape === 1) {
        // Circle
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Triangle
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    };
    
    // Update confetti position
    const updateConfetti = (p) => {
      p.x += Math.sin(p.angle) * 2;
      p.y += p.speed;
      p.rotation += p.rotationSpeed;
      p.angle += p.angularVel;
      
      // Slow particles as they fall
      p.speed = Math.max(p.speed - 0.01, 0.5);
      
      // Remove particles when they fall outside the canvas
      if (p.y > canvas.height) {
        const index = confettiRef.current.indexOf(p);
        if (index !== -1) {
          confettiRef.current.splice(index, 1);
        }
      }
    };
    
    // Animation loop
    const animate = () => {
      if (!isActive || !canvasRef.current) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw and update all confetti
      confettiRef.current.forEach(p => {
        drawConfetti(p);
        updateConfetti(p);
      });
      
      // Stop animation if all confetti has fallen
      if (confettiRef.current.length === 0) {
        setIsActive(false);
        return;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    // Start animation
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);
  
  if (!isActive) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2000,
        pointerEvents: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </Box>
  );
};

export default ConfettiEffect; 