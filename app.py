import os
import argparse
import logging
import threading
import webbrowser
import time
import signal
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), 'backend', '.env'))
logger = logging.getLogger(__name__)
logger.info("Environment variables loaded from .env file")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('echolens.log')
    ]
)
logger = logging.getLogger(__name__)

def start_backend_server(debug=False, port=5000):
    """Start the Flask backend server."""
    try:
        from backend.echolens_api import app
        logger.info(f"Starting EchoLens.AI backend server on port {port}")
        # Log environment variables (redacted for security)
        logger.info(f"GOOGLE_API_KEY set: {'Yes' if os.environ.get('GOOGLE_API_KEY') else 'No'}")
        logger.info(f"MONGODB_URL set: {'Yes' if os.environ.get('MONGODB_URL') else 'No'}")
        app.run(debug=debug, host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"Failed to start backend server: {str(e)}")
        sys.exit(1)

def start_frontend_server(debug=False, port=3000):
    """Start the React frontend development server."""
    try:
        import subprocess
        import platform
        
        os.chdir("frontend")
        
        # Install dependencies if needed
        if not os.path.exists("node_modules"):
            logger.info("Installing frontend dependencies...")
            subprocess.run(["npm", "install"], check=True)
        
        # Start the development server
        logger.info(f"Starting frontend server on port {port}")
        
        # Use different command based on platform
        if platform.system() == "Windows":
            return subprocess.Popen(f"npm start -- --port {port}", shell=True)
        else:
            return subprocess.Popen(["npm", "start", "--", "--port", str(port)])
    
    except Exception as e:
        logger.error(f"Failed to start frontend server: {str(e)}")
    finally:
        os.chdir("..")

def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down all components."""
    logger.info("Shutting down EchoLens.AI...")
    sys.exit(0)

def main():
    """Main entry point for the EchoLens.AI application."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="EchoLens.AI - Emotion & Sound Translator for Deaf/HoH Users")
    parser.add_argument("--backend-port", type=int, default=5000, help="Port for the backend server")
    parser.add_argument("--frontend-port", type=int, default=3000, help="Port for the frontend server")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    parser.add_argument("--open-browser", action="store_true", help="Automatically open web browser")
    
    # Get the Gemini API key from environment or command line
    parser.add_argument("--api-key", type=str, help="Google Gemini API key")
    
    # Get the MongoDB URL from environment or command line
    parser.add_argument("--mongodb-url", type=str, help="MongoDB Atlas connection URL")
    
    args = parser.parse_args()
    
    # Set environment variables if provided via command line
    if args.api_key:
        os.environ["GOOGLE_API_KEY"] = args.api_key
        logger.info("Using Gemini API key from command line arguments")
    
    if args.mongodb_url:
        os.environ["MONGODB_URL"] = args.mongodb_url
        logger.info("Using MongoDB URL from command line arguments")
    
    # Set up signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    # Start backend server in a separate thread
    backend_thread = threading.Thread(
        target=start_backend_server,
        args=(args.debug, args.backend_port),
        daemon=True
    )
    backend_thread.start()
    
    # Give the backend server a moment to start
    time.sleep(1)
    
    # Start frontend server
    frontend_process = start_frontend_server(args.debug, args.frontend_port)
    
    # Open web browser if requested with --open-browser flag
    if args.open_browser:
        time.sleep(3)  # Give the frontend server a moment to start
        logger.info(f"Opening web browser at http://localhost:{args.frontend_port}")
        webbrowser.open(f"http://localhost:{args.frontend_port}")
    else:
        logger.info(f"App running at http://localhost:{args.frontend_port} (use --open-browser to open automatically)")
    
    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logger.info("Shutting down...")
    finally:
        if frontend_process:
            frontend_process.terminate()

if __name__ == "__main__":
    logger.info("Starting EchoLens.AI application")
    main() 