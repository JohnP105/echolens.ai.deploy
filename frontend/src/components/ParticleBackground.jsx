import React, { useRef, useEffect } from 'react';
import { Box } from '@mui/material';

const ParticleBackground = ({ darkMode }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    
    // Particle settings - moved to the top of the useEffect
    const particleCount = 70;
    const particleColor = darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 150, 243, 0.5)';
    const lineColor = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(33, 150, 243, 0.1)';
    const lineDistance = 150;
    
    // Initialize particles
    function initParticles() {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 3 + 1,
          vx: Math.random() * 0.5 - 0.25,
          vy: Math.random() * 0.5 - 0.25,
          opacity: Math.random() * 0.5 + 0.2
        });
      }
    }
    
    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Draw particles and connect nearby ones
    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw particles
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
      });
      
      // Connect particles with lines
      particles.forEach((p1, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distance = Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2)
          );
          
          if (distance < lineDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor;
            ctx.globalAlpha = (1 - distance / lineDistance) * 0.4;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      });
      
      ctx.globalAlpha = 1;
    }
    
    // Update particle positions
    function updateParticles() {
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx = -p.vx;
        if (p.y < 0 || p.y > canvas.height) p.vy = -p.vy;
      });
    }
    
    // Animation loop
    function animate() {
      updateParticles();
      drawParticles();
      animationFrameId = requestAnimationFrame(animate);
    }
    
    animate();
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [darkMode]);
  
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        opacity: 0.6,
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

export default ParticleBackground; 