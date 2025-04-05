import time
import logging
import threading
import json
import sys
import os
from enum import Enum
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import OM1 integration
try:
    from om1_integration import OM1EmotionDetector
    has_om1 = True
except ImportError:
    logger.warning("OM1 integration not available")
    has_om1 = False

# Optional hardware imports (comment out if not using)
try:
    # For Raspberry Pi GPIO control
    import RPi.GPIO as GPIO
    has_gpio = True
except ImportError:
    logger.warning("RPi.GPIO not available, running in simulation mode")
    has_gpio = False

try:
    # For servo control
    from adafruit_servokit import ServoKit
    has_servos = True
except ImportError:
    logger.warning("ServoKit not available, servo movement will be simulated")
    has_servos = False

try:
    # For LED control
    from rpi_ws281x import PixelStrip, Color
    has_leds = True
except ImportError:
    logger.warning("LED libraries not available, LED effects will be simulated")
    has_leds = False

class RobotState(Enum):
    """Possible states of the robot."""
    IDLE = 0
    LISTENING = 1
    PROCESSING = 2
    RESPONDING = 3
    ERROR = 4

class RobotMovement(Enum):
    """Possible movement patterns for the robot."""
    NOD = 0
    SHAKE = 1
    TILT_LEFT = 2
    TILT_RIGHT = 3
    LOOK_UP = 4
    LOOK_DOWN = 5
    LOOK_AROUND = 6
    WAVE = 7
    JUMP = 8

class RobotController:
    """
    Controls the physical robot hardware based on emotional inputs.
    This class can be configured for different hardware setups.
    """
    
    def __init__(self, config_path=None):
        """
        Initialize the robot controller with hardware configuration.
        
        Args:
            config_path: Path to a JSON configuration file
        """
        self.state = RobotState.IDLE
        self.emotion_detector = OM1EmotionDetector() if has_om1 else None
        
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize hardware components
        self._init_hardware()
        
        logger.info("Robot controller initialized")
    
    def _load_config(self, config_path):
        """Load configuration from a JSON file."""
        default_config = {
            "hardware": {
                "has_servos": has_servos,
                "servo_pins": [0, 1, 2],  # Channels for head pan, tilt, arm
                "has_leds": has_leds,
                "led_count": 16,
                "led_pin": 18,
                "led_brightness": 100,
                "has_speaker": False,
                "speaker_volume": 80
            },
            "movements": {
                "speed": 0.5,  # 0.0 to 1.0
                "range": 0.7   # 0.0 to 1.0
            },
            "emotions": {
                "happy": {"led_color": [0, 255, 0], "movement": "NOD", "sound": "happy.wav"},
                "sad": {"led_color": [0, 0, 255], "movement": "TILT_LEFT", "sound": "sad.wav"},
                "angry": {"led_color": [255, 0, 0], "movement": "SHAKE", "sound": "angry.wav"},
                "neutral": {"led_color": [255, 255, 255], "movement": "LOOK_AROUND", "sound": "neutral.wav"},
                "surprise": {"led_color": [255, 255, 0], "movement": "JUMP", "sound": "surprise.wav"}
            }
        }
        
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    user_config = json.load(f)
                
                # Merge configurations
                for key, value in user_config.items():
                    if key in default_config and isinstance(value, dict):
                        default_config[key].update(value)
                    else:
                        default_config[key] = value
                
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration: {str(e)}")
        
        return default_config
    
    def _init_hardware(self):
        """Initialize the robot's hardware components."""
        # Initialize servos
        self.servos = None
        if self.config["hardware"]["has_servos"] and has_servos:
            try:
                self.servos = ServoKit(channels=16)
                for pin in self.config["hardware"]["servo_pins"]:
                    self.servos.servo[pin].angle = 90  # Center position
                logger.info("Servos initialized")
            except Exception as e:
                logger.error(f"Error initializing servos: {str(e)}")
        
        # Initialize LEDs
        self.leds = None
        if self.config["hardware"]["has_leds"] and has_leds:
            try:
                led_count = self.config["hardware"]["led_count"]
                led_pin = self.config["hardware"]["led_pin"]
                led_brightness = self.config["hardware"]["led_brightness"]
                
                self.leds = PixelStrip(
                    led_count, 
                    led_pin, 
                    800000, 
                    10, 
                    False, 
                    led_brightness, 
                    0
                )
                self.leds.begin()
                self._set_all_leds(Color(255, 255, 255))  # White startup color
                logger.info("LEDs initialized")
            except Exception as e:
                logger.error(f"Error initializing LEDs: {str(e)}")
    
    def _set_all_leds(self, color):
        """Set all LEDs to the same color."""
        if self.leds:
            for i in range(self.leds.numPixels()):
                self.leds.setPixelColor(i, color)
            self.leds.show()
        else:
            # Simulation mode
            r = (color >> 16) & 0xFF
            g = (color >> 8) & 0xFF
            b = color & 0xFF
            logger.info(f"LED simulation: Setting all LEDs to RGB({r}, {g}, {b})")
    
    def _execute_movement(self, movement_type):
        """Execute a predefined movement pattern."""
        # Get movement enum from string if necessary
        if isinstance(movement_type, str):
            try:
                movement_type = RobotMovement[movement_type]
            except KeyError:
                movement_type = RobotMovement.NOD  # Default to nod
        
        speed = self.config["movements"]["speed"]
        movement_range = self.config["movements"]["range"]
        
        if not self.servos:
            # Simulation mode
            logger.info(f"Movement simulation: Executing {movement_type.name}")
            time.sleep(1.0)  # Simulate movement time
            return
        
        # Execute actual servo movements
        try:
            if movement_type == RobotMovement.NOD:
                # Head up and down
                head_tilt = self.config["hardware"]["servo_pins"][1]
                center_pos = 90
                
                for _ in range(2):  # Two nods
                    # Move up
                    for angle in range(center_pos, int(center_pos - 30 * movement_range), -1):
                        self.servos.servo[head_tilt].angle = angle
                        time.sleep(0.01 / speed)
                    
                    # Move down
                    for angle in range(int(center_pos - 30 * movement_range), int(center_pos + 10 * movement_range)):
                        self.servos.servo[head_tilt].angle = angle
                        time.sleep(0.01 / speed)
                    
                    # Back to center
                    for angle in range(int(center_pos + 10 * movement_range), center_pos, -1):
                        self.servos.servo[head_tilt].angle = angle
                        time.sleep(0.01 / speed)
            
            elif movement_type == RobotMovement.SHAKE:
                # Head left and right (shake "no")
                head_pan = self.config["hardware"]["servo_pins"][0]
                center_pos = 90
                
                for _ in range(2):  # Two shakes
                    # Move right
                    for angle in range(center_pos, int(center_pos + 30 * movement_range)):
                        self.servos.servo[head_pan].angle = angle
                        time.sleep(0.01 / speed)
                    
                    # Move left
                    for angle in range(int(center_pos + 30 * movement_range), int(center_pos - 30 * movement_range), -1):
                        self.servos.servo[head_pan].angle = angle
                        time.sleep(0.01 / speed)
                    
                    # Back to center
                    for angle in range(int(center_pos - 30 * movement_range), center_pos):
                        self.servos.servo[head_pan].angle = angle
                        time.sleep(0.01 / speed)
            
            # Other movements can be implemented similarly
            else:
                logger.warning(f"Movement {movement_type.name} not implemented")
        
        except Exception as e:
            logger.error(f"Error executing movement: {str(e)}")
    
    def respond_to_emotion(self, emotion):
        """
        Make the robot respond to a detected emotion.
        
        Args:
            emotion: String name of the emotion
        """
        if emotion not in self.config["emotions"]:
            emotion = "neutral"  # Default to neutral if emotion not found
        
        emotion_config = self.config["emotions"][emotion]
        
        # Update state
        self.state = RobotState.RESPONDING
        
        # Set LED color
        if has_leds and self.leds:
            led_color = emotion_config["led_color"]
            color = Color(led_color[0], led_color[1], led_color[2])
            self._set_all_leds(color)
        
        # Execute movement
        movement = emotion_config["movement"]
        self._execute_movement(movement)
        
        # Play sound (if available)
        if self.config["hardware"]["has_speaker"]:
            sound = emotion_config["sound"]
            self._play_sound(sound)
        
        # Return to idle state
        self.state = RobotState.IDLE
    
    def _play_sound(self, sound_file):
        """Play a sound file (placeholder for actual implementation)."""
        logger.info(f"Sound simulation: Playing {sound_file}")
        # In a real implementation, you would use a library like pygame to play sounds
    
    def run_emotion_detection_loop(self, camera_index=0):
        """
        Run a continuous loop of emotion detection and response.
        
        Args:
            camera_index: Index of the camera to use
        """
        if not self.emotion_detector:
            logger.error("Emotion detector not available")
            return
        
        # This would use OpenCV to get camera frames and the OM1 detector for analysis
        logger.info("Starting emotion detection loop (simulation)")
        
        try:
            while True:
                # Simulate emotion detection
                emotions = ["happy", "sad", "angry", "neutral", "surprise"]
                emotion = np.random.choice(emotions, p=[0.2, 0.2, 0.1, 0.4, 0.1])
                
                logger.info(f"Detected emotion: {emotion}")
                self.respond_to_emotion(emotion)
                
                # Wait a bit before the next detection
                time.sleep(5)
        
        except KeyboardInterrupt:
            logger.info("Emotion detection loop stopped by user")
        except Exception as e:
            logger.error(f"Error in emotion detection loop: {str(e)}")
        finally:
            self._cleanup()
    
    def _cleanup(self):
        """Clean up hardware resources."""
        if has_gpio:
            GPIO.cleanup()
        logger.info("Robot controller resources cleaned up")

# Example usage
if __name__ == "__main__":
    robot = RobotController()
    
    # Demo mode: cycle through all emotions
    emotions = ["happy", "sad", "angry", "neutral", "surprise"]
    
    try:
        for emotion in emotions:
            print(f"Demonstrating response to emotion: {emotion}")
            robot.respond_to_emotion(emotion)
            time.sleep(1)
        
        # Optional: run continuous emotion detection loop
        # robot.run_emotion_detection_loop()
    
    except KeyboardInterrupt:
        print("Demo stopped by user")
    finally:
        robot._cleanup() 