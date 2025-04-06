from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
import json
import time
import logging
import threading
import numpy as np
import base64
import random
import cv2
from io import BytesIO
from PIL import Image

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded environment variables from .env file")
    
    # Debug: Check if API key was found
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    if api_key:
        print(f"Found API key (length: {len(api_key)}): {api_key[:4]}...")
    else:
        print("WARNING: No GOOGLE_API_KEY found in environment variables!")
except ImportError:
    print("python-dotenv not installed. Environment variables from .env file won't be loaded.")
    print("Install with: pip install python-dotenv")

# NumPy compatibility fix
if not hasattr(np, 'float'):
    np.float = float
    np.float = np.float64

import google.generativeai as genai
from datetime import datetime
import sounddevice as sd
import queue
import speech_recognition as sr
from scipy import signal
import tensorflow as tf
import tensorflow_hub as hub

# Import database functions
from database.dbclient import get_db, get_collection
from database.documents import (
    save_chat_message, 
    get_chat_history, 
    clear_chat_history,
    save_detected_sound,
    get_sound_alerts as db_get_sound_alerts,
    save_transcription,
    get_transcriptions as db_get_transcriptions
)

# Define log file path
log_file_path = os.path.join(os.path.dirname(__file__), 'echolens.log')

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,  # Set to DEBUG to capture all database operations
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file_path)
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Logging to file: {log_file_path}")
logger.info(f"Log file cleared at application startup")

# Ensure database module's logger is also set to DEBUG level
logging.getLogger('database.dbclient').setLevel(logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"])

# Configure Gemini API
try:
    # Get API key from environment variable
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not found in environment variables.")
        logger.warning("Make sure you have a .env file with GOOGLE_API_KEY=your_api_key")
        logger.warning("Or set the environment variable manually.")
        logger.warning("Emotion detection will use basic fallback method.")
        model = None
    elif GOOGLE_API_KEY == "your_api_key_here":
        logger.warning("GOOGLE_API_KEY is set to the default placeholder value.")
        logger.warning("Please replace 'your_api_key_here' with your actual Gemini API key.")
        model = None
    else:
        logger.info(f"Initializing Gemini API with key (length: {len(GOOGLE_API_KEY)})")
        genai.configure(api_key=GOOGLE_API_KEY)
        
        # Use Gemini 1.5 Pro model for better multimodal capabilities
        target_model = "models/gemini-1.5-pro"
        
        # Set up Gemini model
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.95,
            "top_k": 30,
            "max_output_tokens": 1024,
        }
        
        safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
        
        # Initialize model
        model = genai.GenerativeModel(
            model_name=target_model,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Initialize a conversation model for maintaining context
        convo_model = genai.GenerativeModel(
            model_name=target_model,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Create a chat session
        chat = convo_model.start_chat(
            history=[
                {
                    "role": "user",
                    "parts": ["You are EchoLens.AI, an intelligent assistant for deaf and hard-of-hearing users. You help them understand their audio environment and provide context about sounds, speech, and emotions."]
                },
                {
                    "role": "model",
                    "parts": ["I understand my role as EchoLens.AI. I'll help deaf and hard-of-hearing users by providing detailed information about their audio environment, including identifying sounds, transcribing speech, analyzing emotional context, and offering relevant spatial awareness details. I'll be concise, clear, and focus on providing the most important audio information."]
                }
            ]
        )
        
        logger.info(f"Gemini API configured successfully with model: {target_model}")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    model = None
    chat = None
    convo_model = None

# Load YAMNet model for audio classification
try:
    logger.info("Loading YAMNet model for audio classification...")
    yamnet_model = hub.load('https://tfhub.dev/google/yamnet/1')
    logger.info("YAMNet model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load YAMNet model: {str(e)}")
    yamnet_model = None

# Default user preferences
default_preferences = {
    "transcription_enabled": True,
    "sound_detection_enabled": True,
    "emotion_detection_enabled": True,
    "directional_audio": True,
    "notification_volume": 70,
    "distance_reporting": True,
    "important_sounds": ["doorbell", "alarm", "phone", "name_called", "car horn", "siren", "dog", "baby crying", "knock"]
}

# In-memory database for development
mock_db = {
    "user_preferences": default_preferences,
    "transcriptions": [],
    "sound_alerts": []
}

# Emotions we can detect
detectable_emotions = [
    "happy", "excited", "sad", "angry", "surprised", "confused", 
    "frustrated", "neutral", "concerned", "sarcastic"
]

# Common phrases for demo/testing
demo_phrases = [
    "I'm really excited about this project!",
    "I'm not sure if this is working correctly.",
    "Could you repeat that? I didn't hear you.",
    "That's amazing news! I'm so happy for you!",
    "I'm sorry to hear that, that must be difficult.",
    "Wait, what did you just say? That's surprising!",
    "I'm a bit frustrated with this situation.",
    "Let's meet tomorrow to discuss the project details.",
    "That doesn't make any sense, I'm confused.",
    "Can you speak louder? It's hard to hear you."
]

# Common sounds for demo/testing
demo_sounds = [
    "doorbell", "alarm", "phone ringing", "car horn", "dog", "baby crying",
    "siren", "applause", "footsteps", "knock", "water running", "typing",
    "bird", "music", "speech", "drum", "engine", "clock"
]

# Audio processing settings
SAMPLE_RATE = 16000  # Hz
CHUNK_DURATION = 3  # seconds
CHANNELS = 2  # Stereo for spatial audio
DTYPE = 'float32'

# Initialize speech recognition
recognizer = sr.Recognizer()
recognizer.energy_threshold = 1000  # Reduced from 4000 to be more sensitive
recognizer.dynamic_energy_threshold = True
recognizer.pause_threshold = 0.8

# Initialize audio queue
audio_queue = queue.Queue()

# Global audio level history
audio_level_history = [random.random() * 0.1 for _ in range(20)]  # Start with some random data
MAX_AUDIO_HISTORY = 20

# Latest spectral analysis
latest_spectral_analysis = None

# Flag to control audio processing thread
is_processing_audio = False
# Flag to enable demo/test mode (generating fake data)
demo_mode = False
# Last time we restarted the audio processing
last_restart_time = 0
# Flag for demo processing
is_demo_processing = False

# Initialize webcam variables
webcam = None
last_frame = None
is_capturing_video = False
frame_buffer = []
MAX_BUFFER_SIZE = 5

def detect_sound_direction(left_channel, right_channel):
    """
    Detect the direction of a sound based on stereo channel data.
    
    Args:
        left_channel: Numpy array of left channel audio data
        right_channel: Numpy array of right channel audio data
        
    Returns:
        Direction information as a dict with angle and text description
    """
    try:
        # Calculate energy in each channel
        left_energy = np.mean(np.abs(left_channel))
        right_energy = np.mean(np.abs(right_channel))
        
        # Add small epsilon to avoid division by zero
        epsilon = 1e-10
        
        # Calculate ratio between channels
        ratio = left_energy / (right_energy + epsilon)
        
        # Log the ratio for debugging
        logger.debug(f"Direction detection - left energy: {left_energy}, right energy: {right_energy}, ratio: {ratio}")
        
        # Calculate approximate angle
        if ratio > 1.1:  # Left is louder (reduced threshold from >1)
            # Sound more from left side
            angle = 270 - min(90, (ratio - 1) * 45)
            direction = "left"
        elif ratio < 0.9:  # Right is louder (increased threshold from <1)
            # Sound more from right side
            angle = 90 - min(90, (1/ratio - 1) * 45)
            direction = "right"
        else:
            # Sound from center
            angle = 0
            direction = "center"
            
        result = {
            "angle": float(angle),
            "direction": direction,
            "confidence": min(1.0, abs(1 - ratio) * 2)
        }
        
        logger.debug(f"Direction detection result: {result}")
        return result
    except Exception as e:
        logger.error(f"Error in direction detection: {str(e)}")
        return {"angle": 0, "direction": "unknown", "confidence": 0}

# Function to start webcam capture with improved performance
def start_webcam_capture():
    global webcam, is_capturing_video
    try:
        if webcam is None:
            webcam = cv2.VideoCapture(0)
            webcam.set(cv2.CAP_PROP_FRAME_WIDTH, 640)  # Set lower resolution for better performance
            webcam.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            webcam.set(cv2.CAP_PROP_FPS, 20)  # Try to capture at higher FPS
            
            if not webcam.isOpened():
                logger.error("Failed to open webcam")
                return False
        
        is_capturing_video = True
        threading.Thread(target=webcam_capture_thread, daemon=True).start()
        logger.info("Webcam capture started successfully")
        return True
    except Exception as e:
        logger.error(f"Error starting webcam: {str(e)}")
        return False

# Function to stop webcam capture
def stop_webcam_capture():
    global webcam, is_capturing_video
    try:
        is_capturing_video = False
        if webcam is not None:
            webcam.release()
            webcam = None
        logger.info("Webcam capture stopped")
        return True
    except Exception as e:
        logger.error(f"Error stopping webcam: {str(e)}")
        return False

# Thread for capturing webcam frames with optimized performance
def webcam_capture_thread():
    global webcam, last_frame, is_capturing_video, frame_buffer
    last_capture_time = time.time()
    frames_captured = 0
    
    while is_capturing_video and webcam is not None:
        try:
            ret, frame = webcam.read()
            if ret:
                # Keep a small buffer of recent frames
                frame_buffer.append(frame)
                if len(frame_buffer) > MAX_BUFFER_SIZE:
                    frame_buffer.pop(0)
                
                # The most recent frame for snapshot requests
                last_frame = frame
                
                # Calculate actual FPS
                frames_captured += 1
                current_time = time.time()
                if current_time - last_capture_time >= 5:  # Log FPS every 5 seconds
                    fps = frames_captured / (current_time - last_capture_time)
                    logger.debug(f"Camera capture FPS: {fps:.2f}")
                    frames_captured = 0
                    last_capture_time = current_time
            else:
                logger.warning("Failed to capture frame")
                # Short sleep to prevent CPU spinning on frame capture failure
                time.sleep(0.1)
        except Exception as e:
            logger.error(f"Error in webcam capture: {str(e)}")
            time.sleep(0.5)  # Sleep on error to prevent high CPU usage

# Function to get the latest webcam frame as base64 with optimized encoding
def get_latest_frame_base64(quality=70):
    global last_frame
    if last_frame is None:
        return None
    
    try:
        # Use lower quality JPEG encoding for faster transfer
        encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
        _, buffer = cv2.imencode('.jpg', last_frame, encode_params)
        return base64.b64encode(buffer).decode('utf-8')
    except Exception as e:
        logger.error(f"Error encoding webcam frame: {str(e)}")
        return None

def analyze_multimodal_with_gemini(audio_text, image_base64=None, sound_classes=None, direction_data=None, emotion_data=None):
    """
    Perform multimodal analysis using Gemini with both audio transcription and visual data
    
    Args:
        audio_text: Transcribed audio text
        image_base64: Base64 encoded image data
        sound_classes: Detected sound classes
        direction_data: Sound direction information
        emotion_data: Detected emotions
        
    Returns:
        Dict with multimodal analysis results
    """
    if not model:
        return {
            "analysis": "Gemini API not available. Using basic analysis.",
            "context": "No advanced context available without Gemini API."
        }
    
    try:
        # Prepare sound classes as formatted text
        sound_text = "No sounds detected"
        if sound_classes and len(sound_classes) > 0:
            sound_list = ", ".join([f"{s['label']} ({int(s['score']*100)}%)" for s in sound_classes[:3]])
            sound_text = f"Detected sounds: {sound_list}"
        
        # Prepare direction data as text
        direction_text = "Unknown direction"
        if direction_data:
            direction_text = f"Sound coming from: {direction_data.get('direction', 'unknown')} direction"
        
        # Prepare emotion data as text
        emotion_text = "No emotion detected"
        if emotion_data:
            emotion_text = f"Detected emotion: {emotion_data.get('emotion', 'neutral')} (confidence: {emotion_data.get('confidence', 0):.2f})"
        
        # Create parts for the prompt
        parts = [
            "You are EchoLens.AI, an advanced audio environment analyzer for deaf and hard-of-hearing users.",
            "Your task is to analyze both visual and audio information to provide a complete understanding of what's happening.",
            "Provide context, identify potential audio events that might be occurring based on the image, and explain the relationship between what's seen and heard.",
            "\nInformation available:"
        ]
        
        if audio_text:
            parts.append(f"\nTranscribed speech: \"{audio_text}\"")
        
        parts.append(f"\n{sound_text}")
        parts.append(f"\n{direction_text}")
        parts.append(f"\n{emotion_text}")
        
        # Add any additional contextual instructions
        parts.append("\nProvide the following in your response:")
        parts.append("1. A brief description of what's happening (combining visual and audio information)")
        parts.append("2. Important sounds that might be present in this environment even if not detected")
        parts.append("3. Any safety concerns or important information for a deaf or hard-of-hearing user")
        parts.append("\nFormat the response in a clear, concise way. Keep the entire response under 150 words.")
        
        # Create prompt using all text parts
        prompt = "\n".join(parts)
        
        # If we have an image, create multimodal content
        if image_base64:
            response = model.generate_content(
                [
                    prompt,
                    {
                        "mime_type": "image/jpeg",
                        "data": base64.b64decode(image_base64)
                    }
                ]
            )
        else:
            # Text-only analysis
            response = model.generate_content(prompt)
        
        # Return the analysis result
        return {
            "analysis": response.text,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in multimodal analysis: {str(e)}")
        return {
            "analysis": f"Error performing analysis: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

def analyze_emotion_with_gemini(text, image_base64=None):
    """
    Analyze the emotional content of text and optional image using Gemini API
    
    Args:
        text: The text to analyze
        image_base64: Optional base64 encoded image for multimodal analysis
        
    Returns:
        Dict with emotion analysis
    """
    if not model or not text:
        # If model is not available, provide a basic fallback emotion analysis
        emotion_analysis = provide_fallback_emotion_analysis(text)
        logger.info(f"Using fallback emotion analysis for: '{text[:30]}...'")
        return emotion_analysis
    
    try:
        # If we have both text and image, perform multimodal emotion analysis
        if image_base64:
            prompt = f"""
            Analyze the emotional tone of this person based on both their text and facial expression.
            Focus on detecting emotions like happy, excited, sad, angry, surprised, confused, frustrated, neutral, concerned, or sarcastic.
            
            Consider both the facial expression in the image AND the text content.
            
            Text to analyze: "{text}"
            
            Respond in JSON format with the following fields:
            - emotion: The primary emotion (happy, excited, sad, angry, surprised, confused, frustrated, neutral, concerned, sarcastic)
            - confidence: A number between 0 and 1 indicating confidence
            - intensity: A number between 0 and 1 indicating intensity
            - visual_cues: Brief description of visual emotional cues observed in the image
            - text_cues: Brief description of emotional cues in the text
            - explanation: Short explanation considering both visual and textual information
            
            JSON response:
            """
            
            response = model.generate_content(
                [
                    prompt,
                    {
                        "mime_type": "image/jpeg", 
                        "data": base64.b64decode(image_base64)
                    }
                ]
            )
        else:
            # Text-only emotion analysis
            prompt = f"""
            Analyze the emotional tone of this text. Respond in JSON format with the following fields:
            - emotion: The primary emotion (happy, excited, sad, angry, surprised, confused, frustrated, neutral, concerned, sarcastic)
            - confidence: A number between 0 and 1 indicating confidence
            - intensity: A number between 0 and 1 indicating intensity
            - explanation: Short explanation of why you detected this emotion
            
            Text to analyze: "{text}"
            
            JSON response:
            """
            
            response = model.generate_content(prompt)
        
        try:
            # Parse JSON from response
            json_str = response.text
            # Extract JSON if it's wrapped in markdown code blocks
            if "```json" in json_str:
                json_str = json_str.split("```json")[1].split("```")[0].strip()
            elif "```" in json_str:
                json_str = json_str.split("```")[1].split("```")[0].strip()
                
            analysis = json.loads(json_str)
            return analysis
        except Exception as e:
            logger.error(f"Error parsing emotion analysis JSON: {str(e)}")
            # Fallback to simple extraction
            return provide_fallback_emotion_analysis(text)
    except Exception as e:
        logger.error(f"Error in emotion analysis: {str(e)}")
        return provide_fallback_emotion_analysis(text)

def provide_fallback_emotion_analysis(text):
    """
    Provide a basic rule-based emotion analysis when Gemini API is not available
    
    Args:
        text: The text to analyze
        
    Returns:
        Dict with basic emotion analysis
    """
    # Simple keyword-based emotion detection
    text = text.lower()
    
    # Define emotion keywords
    emotion_keywords = {
        "happy": ["happy", "joy", "glad", "excellent", "great", "wonderful", "love", "yay", "smile"],
        "excited": ["excited", "amazing", "wow", "awesome", "incredible", "thrilled"],
        "sad": ["sad", "sorry", "unfortunate", "miss", "regret", "disappoint", "cry"],
        "angry": ["angry", "mad", "frustrat", "annoyed", "hate", "upset", "furious"],
        "surprised": ["surprise", "shock", "unexpected", "woah", "whoa", "oh my"],
        "confused": ["confused", "unclear", "don't understand", "what?", "huh?", "lost"],
        "neutral": ["okay", "fine", "alright", "so", "and", "the", "a"]
    }
    
    # Count emotion keywords
    emotion_scores = {}
    for emotion, keywords in emotion_keywords.items():
        score = 0
        for keyword in keywords:
            if keyword in text:
                score += 1
        emotion_scores[emotion] = score
    
    # Default to neutral if no emotions detected
    if all(score == 0 for score in emotion_scores.values()):
        primary_emotion = "neutral"
        confidence = 0.5
        explanation = "No clear emotion markers detected in text"
    else:
        # Get primary emotion
        primary_emotion = max(emotion_scores, key=emotion_scores.get)
        total_score = sum(emotion_scores.values())
        confidence = min(0.7, emotion_scores[primary_emotion] / (total_score + 1) * 0.7)
        explanation = f"Basic keyword detection found {primary_emotion} indicators"
    
    return {
        "emotion": primary_emotion,
        "confidence": confidence,
        "intensity": confidence * 0.8,  # Intensity usually slightly lower than confidence
        "explanation": explanation,
        "source": "fallback"  # Indicate this is from fallback analysis
    }

def identify_sounds_with_yamnet(audio_data):
    """
    Identify sounds in audio data using YAMNet model
    
    Args:
        audio_data: Audio data as numpy array (mono)
        
    Returns:
        List of detected sounds with confidence scores
    """
    if yamnet_model is None or audio_data is None:
        return []
    
    try:
        # Store original stereo data for direction detection
        stereo_data = audio_data.copy() if len(audio_data.shape) > 1 and audio_data.shape[1] > 1 else None
        
        # Ensure audio is mono and correct sample rate (16kHz) for YAMNet
        if len(audio_data.shape) > 1 and audio_data.shape[1] > 1:
            # Convert stereo to mono by averaging channels
            audio_data = np.mean(audio_data, axis=1)
        
        # Ensure correct dtype
        audio_data = audio_data.astype(np.float32)
        
        # Run inference
        scores, embeddings, log_mel_spectrogram = yamnet_model(audio_data)
        
        # Try to get the class map path 
        try:
            # Get the path to the class map CSV file
            class_map_path = yamnet_model.class_map_path().numpy().decode('utf-8')
            logger.info(f"Loading class names from: {class_map_path}")
            
            # Load class names from the CSV file
            class_names = []
            with open(class_map_path) as f:
                for row in f:
                    parts = row.strip().split(',')
                    if len(parts) >= 1:
                        # Format the class name to be more readable
                        class_name = parts[0].strip().replace('_', ' ').title()
                        class_names.append(class_name)
        except Exception as e:
            logger.error(f"Error loading class names: {str(e)}")
            # Fallback class names
            class_names = [
                "Speech", "Music", "Dog", "Cat", "Bird", "Vehicle", "Alarm", 
                "Doorbell", "Phone", "Water", "Wind", "Footsteps", "Knock",
                "Typing", "Applause", "Baby Crying", "Siren", "Clock", "Bell"
            ] + [f"Sound_{i}" for i in range(512)]  # Add fallback for index overflows
        
        # Get top 5 predictions
        top_indices = np.argsort(scores.numpy().mean(axis=0))[-5:][::-1]
        detected_sounds = []
        
        # Make sure we don't access an index that doesn't exist in class_names
        for i in top_indices:
            if i < len(class_names):
                sound_name = class_names[i]
                confidence = float(scores.numpy().mean(axis=0)[i])
                
                if confidence > 0.1:  # Only include sounds with reasonable confidence
                    detected_sounds.append({
                        "sound": sound_name,
                        "confidence": confidence
                    })
            else:
                logger.warning(f"Index {i} out of range for class_names (length: {len(class_names)})")
        
        return detected_sounds
    except Exception as e:
        logger.error(f"Error in sound identification: {str(e)}")
        return []

def generate_demo_transcription():
    """Generate a fake transcription for demo/testing purposes"""
    phrase = random.choice(demo_phrases)
    emotion = random.choice(detectable_emotions)
    confidence = random.random() * 0.5 + 0.5  # 0.5-1.0
    intensity = random.random() * 0.5 + 0.5  # 0.5-1.0
    
    # Explanations based on emotions
    explanations = {
        "happy": "The text contains positive language and enthusiasm",
        "excited": "The text shows high energy and enthusiasm",
        "sad": "The text expresses regret or disappointment",
        "angry": "The text contains forceful language and frustration",
        "surprised": "The text indicates unexpected information",
        "confused": "The text expresses uncertainty or lack of clarity",
        "frustrated": "The text shows dissatisfaction and obstacles",
        "neutral": "The text is factual without strong emotion",
        "concerned": "The text shows worry about a situation",
        "sarcastic": "The text has contradictory sentiment with implied meaning"
    }
    
    return {
        "timestamp": datetime.now().isoformat(),
        "text": phrase,
        "emotion": emotion,
        "emotion_confidence": confidence,
        "emotion_intensity": intensity,
        "explanation": explanations.get(emotion, "Detected through language patterns")
    }

def generate_demo_sound_alert():
    """Generate a fake sound alert for demo/testing purposes"""
    sound = random.choice(demo_sounds)
    confidence = random.random() * 0.5 + 0.5  # 0.5-1.0
    direction = random.choice(["left", "right", "center"])
    
    # Generate angle based on direction
    if direction == "left":
        angle = random.uniform(180, 270)
    elif direction == "right":
        angle = random.uniform(90, 0)
    else:
        angle = random.uniform(0, 360)
        
    return {
        "timestamp": datetime.now().isoformat(),
        "sound": sound,
        "confidence": confidence,
        "direction": direction,
        "angle": angle
    }

def audio_callback(indata, frames, time, status):
    """Callback for audio stream to put data in queue"""
    if status:
        logger.warning(f"Audio callback status: {status}")
    audio_queue.put(indata.copy())

def process_audio_chunk(use_demo_mode=None):
    """
    Process a chunk of audio data for transcription and sound detection
    
    Args:
        use_demo_mode: Override to explicitly use demo mode or not. If None, use global demo_mode.
    """
    global latest_spectral_analysis, audio_level_history
    
    # Determine whether to use demo mode
    is_demo = demo_mode if use_demo_mode is None else use_demo_mode
    
    try:
        if is_demo:
            # Generate random audio level for visualization
            audio_level = abs(random.normalvariate(0, 0.05))
            audio_level_history.append(float(audio_level))
            if len(audio_level_history) > MAX_AUDIO_HISTORY:
                audio_level_history = audio_level_history[-MAX_AUDIO_HISTORY:]
            
            # Randomly generate transcription (20% chance each time)
            if random.random() < 0.2 and mock_db["user_preferences"]["transcription_enabled"]:
                transcription = generate_demo_transcription()
                mock_db["transcriptions"].append(transcription)
                logger.info(f"Demo transcription: {transcription['text']}")
            
            # Randomly generate sound alert (15% chance each time)
            if random.random() < 0.15 and mock_db["user_preferences"]["sound_detection_enabled"]:
                sound_alert = generate_demo_sound_alert()
                mock_db["sound_alerts"].append(sound_alert)
                logger.info(f"Demo sound detected: {sound_alert['sound']} from {sound_alert['direction']}")
                
                # Store in MongoDB database if initialized
                if db_initialized:
                    try:
                        save_detected_sound(
                            sound=sound_alert["sound"],
                            confidence=sound_alert["confidence"],
                            direction=sound_alert["direction"],
                            angle=sound_alert["angle"]
                        )
                    except Exception as e:
                        logger.error(f"Failed to save demo sound alert to database: {str(e)}")
            
            return True
            
        # Get audio data from queue
        audio_data = audio_queue.get(block=False)
        
        # Calculate audio level
        audio_level = np.sqrt(np.mean(audio_data**2))
        audio_level_history.append(float(audio_level))
        if len(audio_level_history) > MAX_AUDIO_HISTORY:
            audio_level_history = audio_level_history[-MAX_AUDIO_HISTORY:]
        
        # Analyze direction
        direction_info = {"angle": 0, "direction": "center", "confidence": 0}
        if audio_data.shape[1] >= 2:  # Ensure we have stereo data
            left_channel = audio_data[:, 0]
            right_channel = audio_data[:, 1]
            direction_info = detect_sound_direction(left_channel, right_channel)
            logger.debug(f"Direction detected: {direction_info['direction']} at {direction_info['angle']}°")
        
        # Sound identification
        if mock_db["user_preferences"]["sound_detection_enabled"]:
            detected_sounds = identify_sounds_with_yamnet(audio_data)
            
            # Add any detected sounds to alerts, regardless of importance
            # This makes spatial audio more likely to be seen for testing
            for sound in detected_sounds:
                if sound["confidence"] > 0.3:  # Lowered threshold from 0.5
                    sound_alert = {
                        "timestamp": datetime.now().isoformat(),
                        "sound": sound["sound"],
                        "confidence": sound["confidence"],
                        "direction": direction_info["direction"],
                        "angle": direction_info["angle"]
                    }
                    mock_db["sound_alerts"].append(sound_alert)
                    logger.info(f"Sound detected: {sound['sound']} from {direction_info['direction']}")
                    
                    # Store in MongoDB database if initialized
                    if db_initialized:
                        try:
                            save_detected_sound(
                                sound=sound["sound"], 
                                confidence=sound["confidence"],
                                direction=direction_info["direction"],
                                angle=direction_info["angle"]
                            )
                        except Exception as e:
                            logger.error(f"Failed to save detected sound to database: {str(e)}")
        
        # Speech recognition (in a separate thread to avoid blocking)
        if (mock_db["user_preferences"]["transcription_enabled"] and 
            audio_level > recognizer.energy_threshold / 100000):  # Even lower threshold to capture more speech
            threading.Thread(target=process_speech, args=(audio_data,)).start()
        
        return True
    except queue.Empty:
        return False
    except Exception as e:
        logger.error(f"Error processing audio chunk: {str(e)}")
        return False

def process_speech(audio_data):
    """Process audio for speech recognition and emotion analysis"""
    try:
        # Convert to mono audio at the correct sample rate for speech recognition
        if audio_data.shape[1] >= 2:
            mono_audio = np.mean(audio_data, axis=1)
        else:
            mono_audio = audio_data.flatten()
        
        # Create AudioData object
        audio_data_obj = sr.AudioData(
            mono_audio.tobytes(),
            sample_rate=SAMPLE_RATE,
            sample_width=4  # float32 is 4 bytes
        )
        
        # Recognize speech
        text = recognizer.recognize_google(audio_data_obj)
        
        if text and len(text.strip()) > 0:
            # Analyze emotion
            emotion_analysis = {"emotion": "neutral", "confidence": 0}
            if mock_db["user_preferences"]["emotion_detection_enabled"]:
                emotion_analysis = analyze_emotion_with_gemini(text)
            
            # Store transcription
            transcription = {
                "timestamp": datetime.now().isoformat(),
                "text": text,
                "emotion": emotion_analysis.get("emotion", "neutral"),
                "emotion_confidence": emotion_analysis.get("confidence", 0),
                "emotion_intensity": emotion_analysis.get("intensity", 0),
                "explanation": emotion_analysis.get("explanation", "")
            }
            
            # Add to in-memory storage
            mock_db["transcriptions"].append(transcription)
            logger.info(f"Transcribed: {text}")
            
            # Save to database if initialized
            if db_initialized:
                try:
                    # Save to database with emotional data
                    save_transcription(
                        text=text,
                        emotion=emotion_analysis.get("emotion", "neutral"),
                        source="automatic"
                    )
                    logger.info(f"Saved transcription to database: {text[:30]}...")
                except Exception as e:
                    logger.error(f"Error saving transcription to database: {str(e)}")
            
            return transcription
    except sr.UnknownValueError:
        # Speech not recognized
        pass
    except sr.RequestError as e:
        logger.error(f"Speech recognition service error: {str(e)}")
    except Exception as e:
        logger.error(f"Error in speech processing: {str(e)}")
    
    return None

def audio_processing_thread():
    """Main audio processing thread for real microphone input"""
    global is_processing_audio
    
    try:
        with sd.InputStream(
            callback=audio_callback,
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            blocksize=int(SAMPLE_RATE * CHUNK_DURATION),
            dtype=DTYPE
        ):
            logger.info("Started audio processing with REAL microphone input")
            is_processing_audio = True
            
            while is_processing_audio:
                process_audio_chunk(False)  # False = use real mic
                time.sleep(0.1)  # Small sleep to prevent CPU hogging
    except Exception as e:
        logger.error(f"Error in audio processing thread: {str(e)}")
    finally:
        is_processing_audio = False
        logger.info("Stopped microphone audio processing")

def demo_processing_thread():
    """Thread for demo data generation without microphone"""
    global is_demo_processing
    
    try:
        logger.info("Started audio processing in DEMO MODE (no microphone access needed)")
        is_demo_processing = True
        
        while is_demo_processing and demo_mode:
            process_audio_chunk(True)  # True = use demo data
            time.sleep(0.5)  # Longer sleep for demo mode
    except Exception as e:
        logger.error(f"Error in demo processing thread: {str(e)}")
    finally:
        is_demo_processing = False
        logger.info("Stopped demo audio processing")

# Initialize database connection
def init_database():
    """Initialize database connection and ensure collections exist."""
    try:
        logger.info("========== Database Initialization Started ==========")
        
        # Check if MongoDB URI is configured
        mongodb_uri = os.environ.get('MONGODB_URI', '')
        if not mongodb_uri:
            logger.warning("MongoDB URI not found. Database functions will not work.")
            return False
        
        logger.debug("Attempting to connect to MongoDB...")
        # Get database connection
        db = get_db()
        logger.debug(f"MongoDB connection established, using database: {db.name}")
        
        # Create indexes for chat messages
        chat_collection = get_collection("chat_messages")
        chat_collection.create_index([("timestamp", -1)])
        chat_collection.create_index([("user_id", 1)])
        
        # Create indexes for sound alerts
        sound_collection = get_collection("sound_alerts")
        sound_collection.create_index([("timestamp", -1)])
        sound_collection.create_index([("user_id", 1)])
        sound_collection.create_index([("sound", 1)])
        
        logger.info("========== Database Initialization Successful ==========")
        return True
    except Exception as e:
        logger.error(f"Database initialization failed: {str(e)}")
        logger.warning("Continuing with in-memory storage only")
        return False

# Initialize database
db_initialized = init_database()

# API Routes
@app.route('/api/status')
def status():
    """
    Get the current status of the API and its services
    """
    api_key = os.environ.get("GOOGLE_API_KEY", "")
    gemini_status = "connected"
    gemini_error = None
    
    # Check Gemini API key status
    if not api_key:
        gemini_status = "missing_key"
        gemini_error = "No API key found"
    elif api_key == "your_api_key_here":
        gemini_status = "invalid_key"
        gemini_error = "Using placeholder API key"
    elif model is None:
        gemini_status = "error"
        gemini_error = "Failed to initialize Gemini model"
    
    status_data = {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "gemini_api": gemini_status,
        "gemini_error": gemini_error,
        "models_loaded": {
            "yamnet": yamnet_model is not None,
            "gemini": model is not None
        },
        "audio_processing": is_processing_audio,
        "demo_mode": demo_mode
    }
    
    # Log API key status
    logger.info(f"API Status request - Gemini API: {gemini_status}")
    if gemini_error:
        logger.warning(f"Gemini API issue: {gemini_error}")
        
    return jsonify(status_data)

@app.route('/api/set-demo-mode', methods=['POST'])
def set_demo_mode():
    """Set demo mode on or off"""
    global demo_mode, is_processing_audio, is_demo_processing, last_restart_time
    
    try:
        data = request.json
        new_demo_mode = data.get('demo_mode', False)
        
        # Prevent rapid restarts (rate limiting)
        current_time = time.time()
        if last_restart_time and (current_time - last_restart_time < 2):
            return jsonify({
                'success': False,
                'error': 'Please wait before changing mode again',
                'demo_mode': demo_mode
            })
        
        # Only take action if the mode is actually changing
        if new_demo_mode != demo_mode:
            logger.info(f"Changing demo mode from {demo_mode} to {new_demo_mode}")
            
            # Update the demo mode flag
            demo_mode = new_demo_mode
            
            # If switching to demo mode
            if demo_mode:
                # If real audio processing is running, stop it
                if is_processing_audio:
                    is_processing_audio = False
                    time.sleep(0.5)  # Small delay to ensure clean shutdown
                
                # Start demo processing if not already running
                if not is_demo_processing:
                    threading.Thread(target=demo_processing_thread, daemon=True).start()
            
            # If switching to real audio mode
            else:
                # Stop demo processing if it's running
                if is_demo_processing:
                    is_demo_processing = False
                    time.sleep(0.5)  # Small delay to ensure clean shutdown
                
                # Real audio processing will be started by the client if needed
            
            last_restart_time = current_time
                
        return jsonify({
            'success': True,
            'demo_mode': demo_mode
        })
    except Exception as e:
        logger.error(f"Error setting demo mode: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'demo_mode': demo_mode
        })

@app.route('/api/sounds/clear', methods=['POST'])
def clear_sound_alerts():
    """Clear sound alerts from the database"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default')
        
        if not db_initialized:
            return jsonify({
                "error": "Database not initialized",
                "deleted": 0
            }), 503
        
        deleted = clear_sound_alerts_from_db(user_id)
        
        return jsonify({
            "user_id": user_id,
            "deleted": deleted,
            "success": True
        })
    except Exception as e:
        logger.error(f"Error clearing sound alerts: {str(e)}")
        return jsonify({
            "error": str(e),
            "deleted": 0,
            "success": False
        }), 500

@app.route('/api/clear-data', methods=['POST'])
def clear_data():
    """Clear all transcriptions and sound alerts"""
    try:
        # Clear the transcriptions and sound alerts in mock_db
        mock_db["transcriptions"] = []
        mock_db["sound_alerts"] = []
        
        # Clear database records if database is initialized
        if db_initialized:
            try:
                # Clear chat messages
                deleted_chats = clear_chat_history("all")
                logger.info(f"Cleared {deleted_chats} chat messages from database")
                
                # Clear sound alerts
                deleted_sounds = clear_sound_alerts_from_db("all")
                logger.info(f"Cleared {deleted_sounds} sound alerts from database")
            except Exception as e:
                logger.error(f"Error clearing database records: {str(e)}")
        
        logger.info("Data cleared successfully")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error clearing data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/start', methods=['POST'])
def start_processing():
    """Start audio processing with real microphone"""
    global is_processing_audio, last_restart_time
    
    # Don't start microphone processing if in demo mode
    if demo_mode:
        return jsonify({
            "status": "ignored",
            "message": "Cannot start microphone in demo mode",
            "demo_mode": demo_mode
        })
    
    if not is_processing_audio:
        # Prevent rapid restarts
        current_time = time.time()
        if current_time - last_restart_time > 2:  # At least 2 seconds between restarts
            last_restart_time = current_time
            # Start in a new thread
            threading.Thread(target=audio_processing_thread, daemon=True).start()
            return jsonify({
                "status": "started", 
                "demo_mode": demo_mode
            })
        else:
            return jsonify({
                "status": "throttled", 
                "message": "Please wait before restarting"
            }), 429
    else:
        return jsonify({
            "status": "already_running", 
            "demo_mode": demo_mode
        })

@app.route('/api/stop', methods=['POST'])
def stop_processing():
    """Stop audio processing"""
    global is_processing_audio
    
    # Only stop microphone processing, not demo processing
    if is_processing_audio:
        is_processing_audio = False
        # Give time for thread to close
        time.sleep(1)
        return jsonify({"status": "stopped"})
    else:
        return jsonify({"status": "not_running"})

@app.route('/api/transcriptions', methods=['GET'])
def get_transcriptions():
    """Get recent transcriptions"""
    # Get parameters with defaults
    limit = request.args.get('limit', default=10, type=int)
    page = request.args.get('page', default=1, type=int)
    emotion = request.args.get('emotion', default=None, type=str)
    
    # Check if we should use the database or in-memory storage
    if db_initialized:
        try:
            # Get transcriptions from database with pagination and filtering
            result = db_get_transcriptions(limit=limit, page=page, emotion=emotion)
            
            # Return the results
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error getting transcriptions from database: {str(e)}")
            # Fall back to in-memory storage if database fails
    
    # Use in-memory storage as fallback
    # Filter by emotion if specified
    filtered_transcriptions = mock_db["transcriptions"]
    if emotion:
        filtered_transcriptions = [t for t in filtered_transcriptions if t.get("emotion") == emotion]
    
    # Return most recent transcriptions first
    transcriptions = sorted(
        filtered_transcriptions, 
        key=lambda x: x["timestamp"], 
        reverse=True
    )[:limit]
    
    return jsonify({
        "total": len(filtered_transcriptions),
        "page": page,
        "limit": limit,
        "transcriptions": transcriptions
    })

@app.route('/api/sounds', methods=['GET'])
def get_sound_alerts():
    """Get recent sound alerts"""
    # Get parameters with defaults
    limit = request.args.get('limit', default=10, type=int)
    page = request.args.get('page', default=1, type=int)
    
    # Check if we should use the database or in-memory storage
    if db_initialized:
        try:
            # Get sound alerts from database with pagination
            result = db_get_sound_alerts(limit=limit, page=page)
            
            # Return the results
            return jsonify(result)
        except Exception as e:
            logger.error(f"Error getting sound alerts from database: {str(e)}")
            # Fall back to in-memory storage if database fails
    
    # Use in-memory storage as fallback
    # Return most recent sound alerts first
    alerts = sorted(
        mock_db["sound_alerts"], 
        key=lambda x: x["timestamp"], 
        reverse=True
    )[:limit]
    
    return jsonify({
        "total": len(mock_db["sound_alerts"]),
        "page": page,
        "limit": limit,
        "soundAlerts": alerts
    })

@app.route('/api/preferences', methods=['GET', 'PUT'])
def manage_preferences():
    """Get or update user preferences (in-memory only)"""
    if request.method == 'GET':
        return jsonify(mock_db["user_preferences"])
    elif request.method == 'PUT':
        try:
            new_preferences = request.json
            # Update only provided fields
            for key, value in new_preferences.items():
                if key in mock_db["user_preferences"]:
                    mock_db["user_preferences"][key] = value
            return jsonify(mock_db["user_preferences"])
        except Exception as e:
            return jsonify({"error": str(e)}), 400

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    """Analyze text for emotion"""
    try:
        text = request.json.get('text', '')
        if not text:
            return jsonify({"error": "No text provided"}), 400
            
        analysis = analyze_emotion_with_gemini(text)
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audio-levels', methods=['GET'])
def get_audio_levels():
    """Get current audio levels for visualization"""
    return jsonify({
        "levels": audio_level_history,
        "is_processing": is_processing_audio
    })

# ========== CHAT FUNCTIONALITY ==========

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Process chat messages using Gemini API
    """
    # Check if Gemini model is available
    if model is None:
        return jsonify({
            "error": "Gemini API is not available. Please configure a valid API key.",
            "response": "I'm sorry, I can't process your message right now because the Gemini API is not configured. Please add a GOOGLE_API_KEY to the environment variables.",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        # Get request data
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', {})
        user_id = data.get('user_id', 'default')
        
        # Log request
        logger.info(f"Chat request received: {message[:30]}... with context: {context}")
        
        # Create prompt with user's message and emotional context
        prompt = f"""You are EchoLens.AI, an AI assistant specialized in helping deaf and hard-of-hearing users understand their audio environment.
        
User Message: "{message}"
Emotional Context: {context.get('emotion', 'neutral')} (Intensity: {context.get('intensity', 'medium')})

Respond to the user in a way that acknowledges their emotional state and provides helpful information.
If the user seems confused or frustrated, be extra clear and supportive in your response.
If the user is asking about sounds or audio features, explain how EchoLens can help detect and classify important sounds.
If the user mentions emotions or speech detection, explain how EchoLens can analyze speech for emotional content.

Keep your response concise (2-4 sentences) and friendly.
"""
        
        # Generate response with Gemini
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Save chat message to database
        if db_initialized:
            try:
                save_chat_message(message, response_text, context, user_id)
                logger.info(f"Chat message saved to database for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to save chat message to database: {str(e)}")
        
        # Log response
        logger.info(f"Chat response generated: {response_text[:50]}...")
        
        # Return response
        return jsonify({
            "response": response_text,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({
            "error": str(e),
            "response": "I'm sorry, I encountered an error processing your message.",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/chat_with_context', methods=['POST'])
def chat_with_context():
    """
    Enhanced chat with environmental context and conversation history
    """
    # Check if Gemini model is available
    if model is None or chat is None:
        return jsonify({
            "error": "Gemini API is not available. Please configure a valid API key.",
            "response": "I'm sorry, I can't process your message right now because the Gemini API is not configured.",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        # Get request data
        data = request.get_json()
        message = data.get('message', '')
        context = data.get('context', {})
        user_id = data.get('user_id', 'default')
        
        # Get environmental context if available
        sounds = context.get('sounds', [])
        sound_text = "No sounds detected"
        if sounds and len(sounds) > 0:
            sound_text = "Detected sounds: " + ", ".join([s.get('label', 'unknown') for s in sounds[:3]])
        
        # Get emotional context if available
        emotion = context.get('emotion', {})
        emotion_text = f"Your emotional state: {emotion.get('emotion', 'neutral')} (intensity: {emotion.get('intensity', 'medium')})"
        
        # Get visual context if available
        image_base64 = get_latest_frame_base64()
        
        # Create the prompt with all context information
        prompt = f"""User message: {message}
        
Environmental context:
- {sound_text}
- {emotion_text}
- Sound direction: {context.get('direction', {}).get('direction', 'unknown')}
        
Respond in a helpful, concise way while considering all this context information.
"""
        
        # Send to the chat API with all context
        if image_base64:
            # Multimodal input with image
            response = chat.send_message(
                [
                    prompt,
                    {
                        "mime_type": "image/jpeg",
                        "data": base64.b64decode(image_base64)
                    }
                ]
            )
        else:
            # Text-only input
            response = chat.send_message(prompt)
        
        # Save chat message to database
        if db_initialized:
            try:
                save_chat_message(message, response.text, context, user_id)
                logger.info(f"Contextual chat message saved to database for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to save contextual chat message to database: {str(e)}")
        
        # Return the response
        return jsonify({
            "response": response.text,
            "has_visual_context": image_base64 is not None,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error in contextual chat: {str(e)}")
        return jsonify({
            "error": str(e),
            "response": "I'm sorry, I encountered an error while processing your message.",
            "timestamp": datetime.now().isoformat()
        }), 500

# Add a new endpoint to retrieve chat history
@app.route('/api/chat/history', methods=['GET'])
def get_chat_message_history():
    """
    Get chat message history for a user
    """
    try:
        user_id = request.args.get('user_id', 'default')
        limit = request.args.get('limit', 20, type=int)
        
        if not db_initialized:
            return jsonify({
                "error": "Database not initialized",
                "messages": []
            }), 503
        
        messages = get_chat_history(limit, user_id)
        
        return jsonify({
            "user_id": user_id,
            "count": len(messages),
            "messages": messages
        })
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        return jsonify({
            "error": str(e),
            "messages": []
        }), 500

# Add a new endpoint to clear chat history
@app.route('/api/chat/clear', methods=['POST'])
def clear_chat_message_history():
    """
    Clear chat message history for a user
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'default')
        
        if not db_initialized:
            return jsonify({
                "error": "Database not initialized",
                "deleted": 0
            }), 503
        
        deleted = clear_chat_history(user_id)
        
        return jsonify({
            "user_id": user_id,
            "deleted": deleted,
            "success": True
        })
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        return jsonify({
            "error": str(e),
            "deleted": 0,
            "success": False
        }), 500

# ========== APP INITIALIZATION ==========

@app.before_first_request
def on_first_request():
    """Auto-start processing on first request based on mode"""
    global is_processing_audio, is_demo_processing, last_restart_time
    
    last_restart_time = time.time()
    
    if demo_mode and not is_demo_processing:
        # Start demo processing
        threading.Thread(target=demo_processing_thread, daemon=True).start()
        logger.info("Auto-started demo processing")
    elif not demo_mode and not is_processing_audio:
        # Start real audio processing
        threading.Thread(target=audio_processing_thread, daemon=True).start()
        logger.info("Auto-started microphone processing")

# ========== API ENDPOINTS FOR MULTIMODAL FEATURES ==========

@app.route('/api/analyze/environment', methods=['POST'])
def analyze_environment():
    """
    Analyze the user's environment using multimodal input (audio + visual)
    """
    # Check if Gemini model is available
    if model is None:
        return jsonify({
            "error": "Gemini API is not available. Please configure a valid API key.",
            "analysis": "I'm sorry, I can't analyze your environment right now because the Gemini API is not configured.",
            "timestamp": datetime.now().isoformat()
        }), 503
    
    try:
        # Get request data
        data = request.get_json()
        
        # Extract available data
        audio_text = data.get('transcription', '')
        sound_classes = data.get('sounds', [])
        direction_data = data.get('direction', {})
        emotion_data = data.get('emotion', {})
        
        # Get latest camera frame if available
        image_base64 = get_latest_frame_base64()
        
        # Perform multimodal analysis
        analysis = analyze_multimodal_with_gemini(
            audio_text, 
            image_base64, 
            sound_classes, 
            direction_data, 
            emotion_data
        )
        
        # Return the analysis
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Error in environment analysis endpoint: {str(e)}")
        return jsonify({
            "error": f"Failed to analyze environment: {str(e)}",
            "analysis": "An error occurred while analyzing your environment.",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/camera/start', methods=['POST'])
def start_camera():
    """
    Start the webcam for visual input
    """
    if start_webcam_capture():
        return jsonify({"status": "success", "message": "Camera started successfully"})
    else:
        return jsonify({"status": "error", "message": "Failed to start camera"}), 500

@app.route('/api/camera/stop', methods=['POST'])
def stop_camera():
    """
    Stop the webcam
    """
    if stop_webcam_capture():
        return jsonify({"status": "success", "message": "Camera stopped successfully"})
    else:
        return jsonify({"status": "error", "message": "Failed to stop camera"}), 500

@app.route('/api/camera/snapshot')
def get_camera_snapshot():
    """
    Get the latest camera snapshot as base64
    """
    quality = request.args.get('quality', default=70, type=int)
    image_base64 = get_latest_frame_base64(quality)
    if image_base64:
        return jsonify({
            "status": "success", 
            "image": image_base64,
            "timestamp": datetime.now().isoformat()
        })
    else:
        return jsonify({
            "status": "error", 
            "message": "No camera image available"
        }), 404

# New route for video stream using multipart response (MJPEG)
@app.route('/api/camera/stream')
def video_stream():
    """
    Stream video as MJPEG for more efficient viewing
    """
    def generate_frames():
        global last_frame
        while is_capturing_video and webcam is not None:
            if last_frame is not None:
                # Use lower quality JPEG encoding for streaming
                encode_params = [int(cv2.IMWRITE_JPEG_QUALITY), 50]  # Lower quality for streaming
                _, buffer = cv2.imencode('.jpg', last_frame, encode_params)
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            else:
                # If no frame is available, send a blank frame
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n\r\n')
            time.sleep(0.04)  # ~25 FPS
    
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

# Clear sound alerts from database
def clear_sound_alerts_from_db(user_id="default"):
    """Clear sound alerts from the database for a specific user"""
    try:
        collection = get_collection("sound_alerts")
        
        # Create filter for the user or all records if no user_id
        filter_query = {}
        if user_id != "all":
            filter_query["user_id"] = user_id
            
        # Delete matching records
        result = collection.delete_many(filter_query)
        deleted_count = result.deleted_count
        
        logger.info(f"Cleared {deleted_count} sound alerts from database for user {user_id}")
        return deleted_count
    except Exception as e:
        logger.error(f"Error clearing sound alerts from database: {str(e)}")
        return 0

# Run the Flask app only if this file is executed directly (not imported)
if __name__ == '__main__':
    # Initialize database
    db_status = init_database()
    logger.info(f"Database initialization status: {'Success' if db_status else 'Failed'}")
    
    # Auto-start appropriate processing mode
    last_restart_time = time.time()
    
    if demo_mode:
        # Start demo processing
        threading.Thread(target=demo_processing_thread, daemon=True).start()
        logger.info("Auto-started demo processing")
    else:
        # Start real audio processing
        threading.Thread(target=audio_processing_thread, daemon=True).start()
        logger.info("Auto-started microphone processing")
    
    # Get port from environment variable
    port = int(os.environ.get("PORT", 5000))
    logger.info(f"Starting Flask app on port {port}")
    
    # Run the Flask app
    app.run(debug=False, host='0.0.0.0', port=port) 