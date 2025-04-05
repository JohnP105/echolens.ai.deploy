import os
import argparse
import logging
import threading
import webbrowser
import time
import signal
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('robomind.log')
    ]
)
logger = logging.getLogger(__name__)

def start_backend_server(debug=False, port=5000):
    """Start the Flask backend server."""
    try:
        from backend.api import app
        logger.info(f"Starting backend server on port {port}")
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

def start_hardware_controller(simulation_mode=True):
    """Start the hardware controller for robot integration."""
    if simulation_mode:
        logger.info("Starting hardware controller in simulation mode")
    else:
        logger.info("Starting hardware controller with real hardware")
    
    try:
        from hardware.robot_controller import RobotController
        
        controller = RobotController()
        
        # Just demonstrate a few emotions and exit
        if simulation_mode:
            emotions = ["happy", "sad", "neutral"]
            for emotion in emotions:
                logger.info(f"Simulating '{emotion}' emotion response")
                controller.respond_to_emotion(emotion)
                time.sleep(2)
        else:
            # Start continuous emotion detection with camera
            controller.run_emotion_detection_loop()
        
    except Exception as e:
        logger.error(f"Error in hardware controller: {str(e)}")

def signal_handler(sig, frame):
    """Handle Ctrl+C to gracefully shut down all components."""
    logger.info("Shutting down RoboMind...")
    sys.exit(0)

def main():
    """Main entry point for the RoboMind application."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="RoboMind - Emotion-Aware Companion Robot")
    parser.add_argument("--backend-port", type=int, default=5000, help="Port for the backend server")
    parser.add_argument("--frontend-port", type=int, default=3000, help="Port for the frontend server")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    parser.add_argument("--hardware", action="store_true", help="Enable physical hardware controller")
    parser.add_argument("--open-browser", action="store_true", help="Automatically open web browser")
    args = parser.parse_args()
    
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
    
    # Start hardware controller if requested
    if args.hardware:
        hardware_thread = threading.Thread(
            target=start_hardware_controller,
            args=(not args.hardware,),  # Simulation mode if --hardware not specified
            daemon=True
        )
        hardware_thread.start()
    
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
    logger.info("Starting RoboMind application")
    main() 