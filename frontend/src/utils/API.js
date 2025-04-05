/**
 * API Client for EchoLens.AI
 */
const API_BASE_URL = 'http://localhost:5000/api';

class API {
  /**
   * Check API status and connections
   * @returns {Promise<Object>} API status information
   */
  static async getStatus() {
    try {
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
      const response = await fetch(`${API_BASE_URL}/preferences?user_id=${userId}`);
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
  static async updatePreferences(preferences, userId = 'default') {
    try {
      const response = await fetch(`${API_BASE_URL}/preferences?user_id=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });
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