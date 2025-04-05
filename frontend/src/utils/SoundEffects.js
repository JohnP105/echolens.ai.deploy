// Sound effects utility for the EchoLens.AI application

// Sound URLs (would be replaced with actual files in production)
const SOUND_URLS = {
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-click-bell-chime-notice-606.mp3',
  success: 'https://assets.mixkit.co/sfx/preview/mixkit-bonus-earned-in-game-2058.mp3',
  error: 'https://assets.mixkit.co/sfx/preview/mixkit-alert-quick-chime-766.mp3',
  notification: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-start-2574.mp3',
  hover: 'https://assets.mixkit.co/sfx/preview/mixkit-plastic-bubble-click-1124.mp3',
  send: 'https://assets.mixkit.co/sfx/preview/mixkit-message-pop-alert-2354.mp3'
};

// Cache for preloaded sounds
const soundCache = {};

// Sound settings
let soundEnabled = true;
let volume = 0.5;

// Preload sounds for better performance
const preloadSounds = () => {
  Object.entries(SOUND_URLS).forEach(([name, url]) => {
    const audio = new Audio();
    audio.src = url;
    audio.volume = volume;
    soundCache[name] = audio;
  });
};

// Play a sound
const playSound = (soundName) => {
  if (!soundEnabled) return;
  
  // If sound is not preloaded, create it now
  if (!soundCache[soundName]) {
    if (!SOUND_URLS[soundName]) {
      console.warn(`Sound "${soundName}" is not defined`);
      return;
    }
    
    const audio = new Audio(SOUND_URLS[soundName]);
    audio.volume = volume;
    soundCache[soundName] = audio;
  }
  
  // Clone the audio to allow multiple plays
  const sound = soundCache[soundName].cloneNode();
  sound.volume = volume;
  sound.play().catch(error => {
    // Browser might block autoplay without user interaction
    console.warn('Failed to play sound:', error);
  });
};

// Toggle sounds on/off
const toggleSound = () => {
  soundEnabled = !soundEnabled;
  return soundEnabled;
};

// Set sound volume (0.0 - 1.0)
const setVolume = (newVolume) => {
  volume = Math.max(0, Math.min(1, newVolume));
  
  // Update volume for all cached sounds
  Object.values(soundCache).forEach(audio => {
    audio.volume = volume;
  });
  
  return volume;
};

// Check if sound is enabled
const isSoundEnabled = () => soundEnabled;

// Get current volume
const getVolume = () => volume;

export default {
  preloadSounds,
  playSound,
  toggleSound,
  setVolume,
  isSoundEnabled,
  getVolume
}; 