/**
 * Utility functions for working with data storage and file exports
 */

// Storage keys for local storage
export const STORAGE_KEYS = {
  CHAT_HISTORY: 'echolens_chat_history',
  SOUND_ALERTS: 'echolens_sound_alerts',
  TRANSCRIPTIONS: 'echolens_transcriptions',
  USER_PREFERENCES: 'echolens_preferences'
};

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save (will be JSON stringified)
 * @returns {boolean} Success status
 */
export const saveData = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    return false;
  }
};

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @param {any} defaultValue - Default value if nothing is found
 * @returns {any} Parsed data or default value
 */
export const loadData = (key, defaultValue = null) => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * Clear data from localStorage
 * @param {string} key - Storage key to clear
 * @returns {boolean} Success status
 */
export const clearData = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error clearing data for key ${key}:`, error);
    return false;
  }
};

/**
 * Export data to a downloadable JSON file
 * @param {object} data - Data to export
 * @param {string} filename - Name of the file to download
 */
export const exportToJsonFile = (data, filename) => {
  try {
    // Convert to JSON string with nice formatting
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create a blob with the data
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Simulate a click on the link
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log(`Exported data to ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error exporting data to ${filename}:`, error);
    return false;
  }
};

/**
 * Import data from a JSON file
 * @param {File} file - File object to import
 * @returns {Promise<object>} Parsed data from the file
 */
export const importFromJsonFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
};

// Default export with all functions
const dataStorage = {
  STORAGE_KEYS,
  saveData,
  loadData,
  clearData,
  exportToJsonFile,
  importFromJsonFile
};

export default dataStorage; 