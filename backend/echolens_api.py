from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
import logging
import threading
import google.generativeai as genai
from datetime import datetime
import numpy as np
import sounddevice as sd
import queue
import speech_recognition as sr

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

# Initialize Flask app
app = Flask(__name__)
# More permissive CORS settings - allow everything
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization", "Accept"])  # Super permissive CORS settings

# Configure Gemini API
try:
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not found in environment variables. Some features may not work.")
    
    logger.info(f"Initializing Gemini API with key length: {len(GOOGLE_API_KEY)}")
    genai.configure(api_key=GOOGLE_API_KEY)
    
    # Fetch available models to verify connection
    try:
        model_list = genai.list_models()
        available_models = [m.name for m in model_list]
        logger.info(f"Available Gemini models: {available_models}")
        
        # Use correct model from available models list
        target_model = "models/gemini-1.5-pro"
        if any("models/gemini-1.5-pro" in model for model in available_models):
            target_model = "models/gemini-1.5-pro"
        elif any("models/gemini-pro" in model for model in available_models):
            target_model = "models/gemini-pro"
        
        logger.info(f"Selected model: {target_model}")
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        target_model = "models/gemini-1.5-pro"  # Default to available model
    
    # Set up Gemini model with updated model names
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
    
    # Use the selected model
    model = genai.GenerativeModel(
        model_name=target_model,
        generation_config=generation_config,
        safety_settings=safety_settings
    )
    
    # Set up vision model for multimodal inputs (using the same model for simplicity)
    vision_model = genai.GenerativeModel(
        model_name=target_model,
        generation_config=generation_config,
        safety_settings=safety_settings
    )
    
    logger.info(f"Gemini API configured successfully with model: {target_model}")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {str(e)}")
    model = None
    vision_model = None

# Default user preferences
default_preferences = {
    "transcription_enabled": True,
    "sound_detection_enabled": True,
    "emotion_detection_enabled": True,
    "directional_audio": True,
    "notification_volume": 70,
    "distance_reporting": True,
    "important_sounds": ["doorbell", "alarm", "phone", "name_called"]
}

# In-memory database for development
mock_db = {
    "user_preferences": default_preferences,
    "transcriptions": [],
    "sound_alerts": []
}

# Common sound effects for classification
common_sounds = {
    "household": ["doorbell", "knock", "microwave beep", "oven timer", "refrigerator hum", "dishwasher"],
    "alerts": ["alarm", "phone ringing", "notification alert", "fire alarm", "security alarm"],
    "human": ["footsteps", "coughing", "sneezing", "laughing", "crying", "shouting", "whispering"],
    "devices": ["keyboard typing", "phone vibration", "computer fan", "printer"],
    "external": ["car horn", "siren", "thunder", "rain", "wind", "construction"]
}

# Emotions we can detect
detectable_emotions = [
    "happy", "excited", "sad", "angry", "surprised", "confused", 
    "frustrated", "neutral", "concerned", "sarcastic"
]

# Audio processing settings
SAMPLE_RATE = 16000  # Hz
CHUNK_DURATION = 3  # seconds
CHANNELS = 1
DTYPE = 'float32'

# Initialize speech recognition
recognizer = sr.Recognizer()
# Adjust for ambient noise - set energy threshold higher
recognizer.energy_threshold = 4000  # default is 300
recognizer.dynamic_energy_threshold = True
# Set the timeout for waiting for phrase
recognizer.pause_threshold = 0.8  # default is 0.8 seconds

# Initialize audio queue
audio_queue = queue.Queue()

# Function to process audio in real time
def audio_callback(indata, frames, time, status):
    """Callback function for handling incoming audio data"""
    if status:
        logger.warning(f"Audio status: {status}")
    
    # Put audio data in the queue
    audio_queue.put(indata.copy())

# Audio processing function
def process_audio_chunk(audio_data=None):
    """
    Process audio data to extract transcription, emotion, and environmental sounds.
    """
    import random
    
    # Initialize results
    results = {
        "timestamp": datetime.now().isoformat(),
        "speech_detected": False,
        "environmental_sound_detected": False,
        "transcription": None,
        "emotion": None,
        "sound_event": None
    }
    
    # If no audio data provided or we're in development mode, use mock data
    if audio_data is None:
        logger.warning("Using mock audio processing - real audio not available")
        # Randomly decide if we detected speech or environmental sound
        has_speech = random.random() > 0.3
        has_sound = random.random() > 0.5
        
        results["speech_detected"] = has_speech
        results["environmental_sound_detected"] = has_sound
        
        # Mock speech detection
        if has_speech:
            sample_phrases = [
                "I'm really excited about this project!",
                "Can you help me understand what that sound was?",
                "I'm not sure if this is working correctly.",
                "The weather today is beautiful.",
                "Did you hear that noise from the kitchen?",
                "I don't think you understood what I meant."
            ]
            
            results["transcription"] = {
                "text": random.choice(sample_phrases),
                "confidence": random.uniform(0.7, 0.98)
            }
            
            # Use Gemini for emotion or fallback to random
            if model and results["transcription"]["text"]:
                try:
                    prompt = f"""
                    Analyze the following text and determine the most likely emotion being expressed.
                    Return only one word from this list: {', '.join(detectable_emotions)}.
                    
                    Text: "{results["transcription"]["text"]}"
                    
                    Emotion:
                    """
                    
                    response = model.generate_content(prompt)
                    emotion = response.text.strip().lower()
                    
                    # Validate the emotion is in our list
                    if emotion in detectable_emotions:
                        results["emotion"] = emotion
                    else:
                        results["emotion"] = "neutral"
                except Exception as e:
                    logger.error(f"Error detecting emotion: {str(e)}")
                    results["emotion"] = "neutral"
            else:
                results["emotion"] = random.choice(detectable_emotions)
        
        # Mock sound detection
        if has_sound:
            sound_category = random.choice(list(common_sounds.keys()))
            sound_type = random.choice(common_sounds[sound_category])
            
            # Generate a more specific description with direction and distance
            directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"]
            direction = random.choice(directions)
            distance = f"{random.randint(2, 30)}ft"
            
            # Create a description
            if sound_type == "doorbell":
                description = f"Doorbell (front door)"
            elif sound_type == "knock":
                description = f"Knocking ({direction} door)"
            elif sound_type == "footsteps":
                description = f"Footsteps approaching ({direction})"
            elif sound_type == "phone ringing":
                description = f"Phone ringing ({random.choice(['bedroom', 'kitchen', 'living room'])})"
            else:
                description = f"{sound_type.title()} ({direction})"
            
            # Determine priority based on sound type
            high_priority = ["alarm", "fire alarm", "doorbell", "phone ringing"]
            medium_priority = ["knock", "microwave beep", "oven timer", "notification alert"]
            
            if sound_type in high_priority:
                priority = "high"
            elif sound_type in medium_priority:
                priority = "medium"
            else:
                priority = "low"
            
            results["sound_event"] = {
                "sound_type": sound_type,
                "category": sound_category,
                "description": description,
                "direction": direction,
                "distance": distance,
                "priority": priority
            }
        
        return results
    
    # Process real audio data when available
    try:
        # For real audio processing, convert the audio data to the format expected by SpeechRecognition
        # This is a simplified implementation
        
        # 1. Convert audio data to a format SpeechRecognition can use
        # SpeechRecognition expects audio in a different format so we need to convert
        audio_np = audio_data.astype(np.float32)
        
        # We need to convert the numpy array to an audio source SpeechRecognition can use
        # For simplicity, we'll save it to a temporary WAV file then read it back
        import wave
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_filename = temp_file.name
        
        # Save as WAV file
        with wave.open(temp_filename, 'wb') as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(SAMPLE_RATE)
            # Convert float32 to int16
            audio_int16 = (audio_np * 32767).astype(np.int16)
            wf.writeframes(audio_int16.tobytes())
        
        # Use SpeechRecognition to transcribe the audio
        with sr.AudioFile(temp_filename) as source:
            audio = recognizer.record(source)  # get all audio from the source
            
            try:
                # Use Google's speech recognition API (free tier)
                transcription_text = recognizer.recognize_google(audio)
                confidence = 0.8  # estimate
                
                # If we got a transcription, update results
                if transcription_text:
                    results["speech_detected"] = True
                    results["transcription"] = {
                        "text": transcription_text,
                        "confidence": confidence
                    }
                    
                    # Use Gemini for emotion detection
                    if model:
                        try:
                            prompt = f"""
                            Analyze the following text and determine the most likely emotion being expressed.
                            Return only one word from this list: {', '.join(detectable_emotions)}.
                            
                            Text: "{transcription_text}"
                            
                            Emotion:
                            """
                            
                            response = model.generate_content(prompt)
                            emotion = response.text.strip().lower()
                            
                            # Validate the emotion is in our list
                            if emotion in detectable_emotions:
                                results["emotion"] = emotion
                            else:
                                results["emotion"] = "neutral"
                        except Exception as e:
                            logger.error(f"Error detecting emotion: {str(e)}")
                            results["emotion"] = "neutral"
            except sr.UnknownValueError:
                # Speech was unintelligible
                logger.debug("Speech recognition could not understand audio")
            except sr.RequestError as e:
                # API was unreachable or unresponsive
                logger.error(f"Could not request results from Google Speech Recognition service: {e}")
        
        # Clean up the temporary file
        try:
            os.unlink(temp_filename)
        except Exception as e:
            logger.warning(f"Error removing temporary file: {e}")
        
        # 2. Use Gemini to detect environmental sounds
        # In a real implementation, we'd use a specialized sound classification model
        if model and not results["speech_detected"]:
            # Check if there's significant audio energy
            energy = np.mean(np.abs(audio_np))
            if energy > 0.05:  # Arbitrary threshold
                results["environmental_sound_detected"] = True
                
                # Ask Gemini to classify the sound
                prompt = f"""
                I've detected an environmental sound (not speech).
                Based on these audio characteristics:
                - Energy level: {energy}
                - Peak amplitude: {np.max(np.abs(audio_np))}
                
                Provide:
                1. A sound type from this list: {str(list(sum(common_sounds.values(), [])))}
                2. A likely category from these categories: household, alerts, human, devices, external
                
                Reply in JSON format with keys: "sound_type", "category"
                """
                
                try:
                    response = model.generate_content(prompt)
                    response_text = response.text.strip()
                    
                    # Try to parse the JSON response
                    try:
                        import re
                        # Find JSON-like content in the response
                        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                        if json_match:
                            json_str = json_match.group(0)
                            sound_info = json.loads(json_str)
                            sound_type = sound_info.get("sound_type", "unknown sound")
                            sound_category = sound_info.get("category", "household")
                        else:
                            # Fallback if no JSON found
                            sound_type = "unknown sound"
                            sound_category = "household"
                    except Exception as e:
                        logger.error(f"Error parsing Gemini response: {e}")
                        sound_type = "unknown sound"
                        sound_category = "household"
                    
                    # Generate a description with direction
                    directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"]
                    direction = random.choice(directions)
                    distance = "nearby"  # Simplified for now
                    
                    if sound_type == "doorbell":
                        description = f"Doorbell (front door)"
                    elif sound_type == "knock":
                        description = f"Knocking ({direction} door)"
                    elif sound_type == "footsteps":
                        description = f"Footsteps approaching ({direction})"
                    elif sound_type == "phone ringing":
                        description = f"Phone ringing (nearby)"
                    else:
                        description = f"{sound_type.title()} ({direction})"
                    
                    # Determine priority based on sound type
                    high_priority = ["alarm", "fire alarm", "doorbell", "phone ringing"]
                    medium_priority = ["knock", "microwave beep", "oven timer", "notification alert"]
                    
                    if sound_type in high_priority:
                        priority = "high"
                    elif sound_type in medium_priority:
                        priority = "medium"
                    else:
                        priority = "low"
                    
                    results["sound_event"] = {
                        "sound_type": sound_type,
                        "category": sound_category,
                        "description": description,
                        "direction": direction,
                        "distance": distance,
                        "priority": priority
                    }
                except Exception as e:
                    logger.error(f"Error classifying environmental sound: {e}")
        
    except Exception as e:
        logger.error(f"Error processing audio chunk: {str(e)}")
    
    return results

# Continuous audio processing thread
def audio_processing_thread():
    """Process audio continuously in a background thread."""
    logger.info("Starting audio processing thread")
    
    # Try to set up real-time audio capture
    real_audio_enabled = False
    audio_stream = None
    
    try:
        audio_stream = sd.InputStream(
            callback=audio_callback,
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            blocksize=int(SAMPLE_RATE * CHUNK_DURATION),
            dtype=DTYPE
        )
        audio_stream.start()
        real_audio_enabled = True
        logger.info("Real-time audio capture started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize audio stream: {str(e)}")
        logger.warning("Falling back to mock audio generation")
    
    # Main processing loop
    while True:
        try:
            audio_data = None
            
            # Try to get real audio data from the queue
            if real_audio_enabled:
                try:
                    audio_data = audio_queue.get(timeout=CHUNK_DURATION)
                    logger.debug("Audio chunk received from microphone")
                except queue.Empty:
                    logger.debug("No audio data received, continuing...")
            
            # Process the audio chunk
            results = process_audio_chunk(audio_data)
            
            # Store transcription if speech was detected
            if results["speech_detected"] and results["transcription"]:
                transcription = {
                    "id": len(mock_db["transcriptions"]) + 1,
                    "text": results["transcription"]["text"],
                    "emotion": results["emotion"],
                    "timestamp": results["timestamp"]
                }
                
                # Store in mock database
                mock_db["transcriptions"].append(transcription)
                logger.info(f"New transcription: {transcription['text']}")
            
            # Store sound event if detected
            if results["environmental_sound_detected"] and results["sound_event"]:
                sound_alert = {
                    "id": len(mock_db["sound_alerts"]) + 1,
                    "soundType": results["sound_event"]["sound_type"],
                    "description": results["sound_event"]["description"],
                    "direction": results["sound_event"]["direction"],
                    "distance": results["sound_event"]["distance"],
                    "priority": results["sound_event"]["priority"],
                    "timestamp": results["timestamp"]
                }
                
                # Store in mock database
                mock_db["sound_alerts"].append(sound_alert)
                logger.info(f"New sound alert: {sound_alert['description']}")
            
            # Limit the size of our in-memory storage
            if len(mock_db["transcriptions"]) > 100:
                mock_db["transcriptions"] = mock_db["transcriptions"][-50:]
            
            if len(mock_db["sound_alerts"]) > 100:
                mock_db["sound_alerts"] = mock_db["sound_alerts"][-50:]
                
            # Add a small delay to control processing rate
            time.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error in audio processing thread: {str(e)}")
            time.sleep(5)  # Wait longer after an error
    
    # Clean up audio stream on exit
    if audio_stream:
        audio_stream.stop()
        audio_stream.close()

# Start the audio processing thread
audio_thread = threading.Thread(target=audio_processing_thread, daemon=True)
audio_thread.start()

# API Routes
@app.route('/api/status', methods=['GET'])
def status():
    """Check the API status and Gemini connectivity."""
    gemini_status = "connected" if model is not None else "disconnected"
    speech_recognition_status = "connected" if recognizer is not None else "disconnected"
    
    return jsonify({
        "status": "online",
        "gemini_api": gemini_status,
        "speech_recognition": speech_recognition_status,
        "audio_processing": "active"
    })

@app.route('/api/transcriptions', methods=['GET'])
def get_transcriptions():
    """Get recent speech transcriptions with emotion analysis."""
    # Get parameters for pagination/filtering
    limit = request.args.get('limit', default=10, type=int)
    page = request.args.get('page', default=1, type=int)
    emotion = request.args.get('emotion', default=None, type=str)
    
    skip = (page - 1) * limit
    
    # Use in-memory database
    transcriptions = mock_db["transcriptions"]
    
    # Apply emotion filter if specified
    if emotion:
        transcriptions = [t for t in transcriptions if t["emotion"] == emotion]
    
    # Calculate total for pagination
    total = len(transcriptions)
    
    # Simple pagination and sort (newest first)
    transcriptions = sorted(transcriptions, key=lambda x: x["timestamp"], reverse=True)[skip:skip+limit]
    
    # Return paginated results
    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "transcriptions": transcriptions
    })

@app.route('/api/sounds', methods=['GET'])
def get_sound_alerts():
    """Get environmental sound alerts."""
    # Get parameters for pagination/filtering
    limit = request.args.get('limit', default=10, type=int)
    page = request.args.get('page', default=1, type=int)
    priority = request.args.get('priority', default=None, type=str)
    
    skip = (page - 1) * limit
    
    # Use in-memory database
    sound_alerts = mock_db["sound_alerts"]
    
    # Apply priority filter if specified
    if priority:
        sound_alerts = [s for s in sound_alerts if s["priority"] == priority]
    
    # Calculate total for pagination
    total = len(sound_alerts)
    
    # Simple pagination and sort (newest first)
    sound_alerts = sorted(sound_alerts, key=lambda x: x["timestamp"], reverse=True)[skip:skip+limit]
    
    # Return paginated results
    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "soundAlerts": sound_alerts
    })

@app.route('/api/preferences', methods=['GET', 'PUT'])
def manage_preferences():
    """Get or update user preferences."""
    user_id = request.args.get('user_id', default="default", type=str)
    
    if request.method == 'GET':
        # Return from in-memory mock database
        return jsonify(mock_db["user_preferences"])
    
    elif request.method == 'PUT':
        data = request.json
        
        # Update in-memory mock database
        for key, value in data.items():
            if key in mock_db["user_preferences"]:
                mock_db["user_preferences"][key] = value
        
        return jsonify({
            "success": True,
            "preferences": mock_db["user_preferences"]
        })

@app.route('/api/analyze/audio', methods=['POST'])
def analyze_audio_sample():
    """
    Analyze an audio sample with Gemini.
    In a real app, this would accept audio files.
    """
    # This is a mock endpoint for now
    # In a real implementation, we would:
    # 1. Accept audio file upload
    # 2. Process it for speech and environmental sounds
    # 3. Use Gemini to enhance the analysis
    
    return jsonify({
        "success": True,
        "results": process_audio_chunk()
    })

@app.route('/api/analyze/text', methods=['POST'])
def analyze_text():
    """Analyze text for emotion using Gemini."""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        if not model:
            return jsonify({"error": "Gemini API not configured"}), 503
        
        # Use Gemini to analyze emotion
        prompt = f"""
        Analyze the following text and determine the most likely emotion being expressed.
        Return only one word from this list: {', '.join(detectable_emotions)}.
        
        Text: "{text}"
        
        Emotion:
        """
        
        response = model.generate_content(prompt)
        emotion = response.text.strip().lower()
        
        # Validate the emotion is in our list
        if emotion not in detectable_emotions:
            emotion = "neutral"
        
        # Store this transcription
        transcription = {
            "text": text,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat(),
            "source": "manual_input",
            "id": len(mock_db["transcriptions"]) + 1
        }
        
        # Store in mock database
        mock_db["transcriptions"].append(transcription)
        
        return jsonify({
            "success": True,
            "text": text,
            "emotion": emotion
        })
        
    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint that uses Gemini to generate responses."""
    try:
        data = request.json
        user_message = data.get('message', '')
        context = data.get('context', {})
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        if not model:
            return jsonify({"error": "Gemini API not configured"}), 503
        
        # Prepare prompt with emotional context if available
        emotion_context = ""
        if context and 'emotion' in context:
            emotion = context.get('emotion', 'neutral')
            intensity = context.get('intensity', 'medium')
            emotion_context = f"\nThe user's current emotional state appears to be {emotion} with {intensity} intensity."
        
        # Use Gemini to generate a response
        prompt = f"""
        You are EchoLens.AI, a sound and emotion translator designed to help Deaf and hard-of-hearing users.
        You can detect environmental sounds and emotional tones in speech.
        
        Please respond to the following message from the user in a helpful, conversational way.{emotion_context}
        
        User: {user_message}
        
        EchoLens.AI:
        """
        
        response = model.generate_content(prompt)
        bot_response = response.text.strip()
        
        return jsonify({
            "success": True,
            "response": bot_response
        })
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

# For testing and development
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    logger.info(f"Starting backend server on port {port}, debug mode: {debug}")
    app.run(debug=debug, host='0.0.0.0', port=port) 