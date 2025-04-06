/**
 * Configuration for the EchoLens.AI application
 */

// Development settings
export const DEV_CONFIG = {
  useMockData: false, // No mock data - use real API only
  mockLatency: 0,  // No artificial latency
};

// API endpoint configurations
// Use environment variable in production, fallback to localhost for development
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const PREFERENCES_API_URL = `${API_BASE_URL}/preferences`;

// Audio visualization settings
export const AUDIO_VISUALIZATION_CONFIG = {
  refreshInterval: 500, // ms
  maxDataPoints: 100,
  historyLength: 20,
};

// Sound detection settings
export const SOUND_DETECTION_CONFIG = {
  defaultEnergyThreshold: 0.002,
  defaultPeakHeight: 0.3,
  defaultPeakEnergy: 0.3,
};

// Application theme settings
export const THEME_CONFIG = {
  prefersDarkMode: true,
  primaryColor: '#2196F3',
  secondaryColor: '#21CBF3',
}; 