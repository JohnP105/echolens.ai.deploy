/**
 * API Client for EchoLens.AI
 */
import { API_BASE_URL, PREFERENCES_API_URL } from '../config';

// Disable mock data - always use real API
const USE_MOCK_DATA = false;

// Remove or comment out mock data generator
/*
const generateMockData = {
  status() {
    return {
      status: 'online',
      gemini_api: 'connected',
      models_loaded: {
        yamnet: true,
        gemini: true
      },
      audio_processing: true,
      demo_mode: true
    };
  },
  
  analyzeText(text) {
    // Simple sentiment analysis based on keywords
    const emotions = ['happy', 'sad', 'angry', 'neutral', 'excited', 'confused', 'frustrated', 'surprised'];
    
    // Default to neutral
    let emotion = 'neutral';
    
    // Check for emotion keywords
    if (text.match(/happy|joy|great|excellent|awesome|love|like/i)) emotion = 'happy';
    else if (text.match(/sad|unhappy|disappointed|miss|lost/i)) emotion = 'sad';
    else if (text.match(/angry|mad|furious|upset|hate/i)) emotion = 'angry';
    else if (text.match(/excited|thrilled|can't wait|looking forward/i)) emotion = 'excited';
    else if (text.match(/confused|don't understand|what\?|how\?|why\?/i)) emotion = 'confused';
    else if (text.match(/frustrated|annoyed|irritated|not working/i)) emotion = 'frustrated';
    else if (text.match(/wow|whoa|oh my|really\?|surprising/i)) emotion = 'surprised';
    
    return {
      emotion,
      emotion_confidence: 0.85,
      emotion_intensity: 'medium'
    };
  },
  
  chat(message, context) {
    // Simple mock responses based on message content
    const responses = [
      "I understand how you feel. How can I help you today?",
      "That's interesting! Tell me more about it.",
      "I'm analyzing the audio environment around you and can help interpret sounds.",
      "EchoLens is designed to help with audio accessibility. Is there something specific you need help with?",
      "I noticed a pattern in the environmental sounds. Would you like me to explain what I'm detecting?",
      "The emotional context of your message helps me provide better responses."
    ];
    
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Add some context-specific responses
    if (context?.emotion === 'happy') {
      response = "I'm glad you're feeling positive! " + response;
    } else if (context?.emotion === 'sad' || context?.emotion === 'frustrated') {
      response = "I'm sorry you're feeling that way. " + response;
    }
    
    // Add some keyword-specific responses
    if (message.match(/help|how do I|how to/i)) {
      response = "To use EchoLens, simply allow microphone access and I'll help interpret the sounds around you. You can switch between different modes using the tabs.";
    } else if (message.match(/sound|hear|audio|noise/i)) {
      response = "I'm designed to detect and classify different sounds in your environment, from critical alerts like alarms to everyday sounds like appliances or vehicles.";
    } else if (message.match(/emotion|feeling|sentiment/i)) {
      response = "I can analyze speech for emotional content, helping you understand not just what people are saying, but how they're saying it.";
    }
    
    return {
      response,
      timestamp: new Date().toISOString()
    };
  }
};
*/

class API {
  /**
   * Get the API base URL
   * @returns {string} API base URL
   */
  static getApiBaseUrl() {
    return API_BASE_URL;
  }
  
  /**
   * Check the status of the backend API
   * @returns {Promise<Object>} Server status information
   */
  static async checkStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/status`);
      return await response.json();
    } catch (error) {
      console.error('Error checking status:', error);
      return {
        status: 'error',
        message: 'Could not connect to server',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check API status and connections
   * @returns {Promise<Object>} API status information
   */
  static async getStatus() {
    try {
      // Connect to the real API
      console.log('Calling API status endpoint:', `${API_BASE_URL}/status`);
      const response = await fetch(`${API_BASE_URL}/status`, {
        mode: 'cors', // Explicitly request CORS
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API status response:', data);
      return data;
    } catch (error) {
      console.error('Error checking API status:', error);
      
      // No mock data, return offline status
      return { 
        status: 'offline',
        error: error.message
      };
    }
  }

  /**
   * Get recent transcriptions with pagination
   * @param {number} page - Page number (starting from 1)
   * @param {number} limit - Number of items per page
   * @param {string} emotion - Optional emotion filter
   * @returns {Promise<Object>} Transcriptions data with pagination info
   */
  static async getTranscriptions(page = 1, limit = 10, emotion = null) {
    try {
      let url = `${API_BASE_URL}/transcriptions?page=${page}&limit=${limit}`;
      if (emotion) {
        url += `&emotion=${emotion}`;
      }
      
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      throw error;
    }
  }

  /**
   * Get sound alerts with pagination
   * @param {number} page - Page number (starting from 1)
   * @param {number} limit - Number of items per page
   * @param {string} priority - Optional priority filter (high, medium, low)
   * @returns {Promise<Object>} Sound alerts data with pagination info
   */
  static async getSoundAlerts(page = 1, limit = 10, priority = null) {
    try {
      let url = `${API_BASE_URL}/sounds?page=${page}&limit=${limit}`;
      if (priority) {
        url += `&priority=${priority}`;
      }
      
      const response = await fetch(url);
      return await response.json();
    } catch (error) {
      console.error('Error fetching sound alerts:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID (default: "default")
   * @returns {Promise<Object>} User preferences
   */
  static async getPreferences(userId = 'default') {
    try {
      const response = await fetch(PREFERENCES_API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences to update
   * @param {string} userId - User ID (default: "default")
   * @returns {Promise<Object>} Updated user preferences
   */
  static async updatePreferences(preferences) {
    try {
      const response = await fetch(PREFERENCES_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Analyze text for emotion using Gemini API
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Analysis results
   */
  static async analyzeText(text) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  }

  /**
   * Analyze the environment using multimodal capabilities (audio + visual)
   * @param {Object} data - The data for analysis including transcription, sounds, etc.
   * @returns {Promise<Object>} Multimodal analysis results
   */
  static async analyzeEnvironment(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/environment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Error analyzing environment:', error);
      throw error;
    }
  }

  /**
   * Start the camera for visual input
   * @returns {Promise<Object>} Response
   */
  static async startCamera() {
    try {
      const response = await fetch(`${API_BASE_URL}/camera/start`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }

  /**
   * Stop the camera
   * @returns {Promise<Object>} Response
   */
  static async stopCamera() {
    try {
      console.log('Stopping camera...');
      const response = await fetch(`${API_BASE_URL}/camera/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Error stopping camera: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Camera stop response:', data);
      return data;
    } catch (error) {
      console.error('Error stopping camera:', error);
      throw error;
    }
  }

  /**
   * Get the latest camera snapshot
   * @returns {Promise<Object>} Response with base64 image
   */
  static async getCameraSnapshot() {
    try {
      const response = await fetch(`${API_BASE_URL}/camera/snapshot`);
      return await response.json();
    } catch (error) {
      console.error('Error getting camera snapshot:', error);
      throw error;
    }
  }

  /**
   * Enhanced chat with environmental context
   * @param {string} message - User message
   * @param {Object} context - Environmental context data
   * @returns {Promise<Object>} Chat response
   */
  static async chatWithContext(message, context = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat_with_context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, context }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error in contextual chat:', error);
      throw error;
    }
  }

  /**
   * Analyze audio sample (mock method for now)
   * @returns {Promise<Object>} Analysis results
   */
  static async analyzeAudio() {
    try {
      const response = await fetch(`${API_BASE_URL}/analyze/audio`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      console.error('Error analyzing audio:', error);
      throw error;
    }
  }

  /**
   * Get real-time audio level data
   * @returns {Promise<Object>} Audio level data
   */
  static async getAudioLevels() {
    try {
      const response = await fetch(`${API_BASE_URL}/audio-levels`);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching audio levels:', error);
      throw error;
    }
  }

  /**
   * Update calibration settings
   * @param {Object} settings - Calibration settings to update
   * @returns {Promise<Object>} Updated calibration settings
   */
  static async updateCalibrationSettings(settings) {
    try {
      const response = await fetch(`${API_BASE_URL}/calibration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating calibration settings:', error);
      throw error;
    }
  }

  /**
   * Send message to chat endpoint with emotional context
   * @param {string} message - User message to send
   * @param {Object} context - Optional context object (emotion, intensity, etc.)
   * @returns {Promise<Object>} Chat response
   */
  static async chat(message, context = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          context 
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error sending chat message:', error);
      throw error;
    }
  }
}

export default API; 