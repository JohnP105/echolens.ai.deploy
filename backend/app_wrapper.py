"""
Wrapper script to run the Flask application with the correct port from environment variable.
This is needed for deployment on Render.
"""

import os
import sys
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Get the port from environment variable
port = int(os.environ.get("PORT", 10000))
logger.info(f"Starting app on port {port}")

# Import the Flask app without running it yet
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import echolens_api

# Make sure we don't run the app in the module (we'll do it here)
if __name__ == "__main__":
    # Run the Flask app on the specified port
    logger.info(f"Starting Flask app on port {port}")
    echolens_api.app.run(debug=False, host='0.0.0.0', port=port) 