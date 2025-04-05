from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import time
import logging
import threading
import google.generativeai as genai
from datetime import datetime

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

# Audio processing simulation
def process_audio_chunk(audio_data=None):
    """
    Process an audio chunk to extract transcription, emotion, and environmental sounds.
    In a real implementation, this would use audio processing libraries.
    """
    # Simulate processing delay
    time.sleep(0.5)
    
    # Randomly decide if we detected speech or environmental sound
    import random
    has_speech = random.random() > 0.3
    has_sound = random.random() > 0.5
    
    results = {
        "timestamp": datetime.now().isoformat(),
        "speech_detected": has_speech,
        "environmental_sound_detected": has_sound,
        "transcription": None,
        "emotion": None,
        "sound_event": None
    }
    
    # Simulate speech detection and transcription
    if has_speech:
        # In a real app, we would use a speech recognition model here
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
        
        # Simulate emotion detection using Gemini
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
            # Fallback without Gemini
            results["emotion"] = random.choice(detectable_emotions)
    
    # Simulate environmental sound detection
    if has_sound:
        # In a real app, this would come from an audio classification model
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

# Continuous audio processing thread
def audio_processing_thread():
    """Simulates continuous audio processing in a background thread."""
    while True:
        try:
            # Process audio chunk
            results = process_audio_chunk()
            
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
                logger.info(f"New transcription (fallback): {transcription['text']}")
            
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
                logger.info(f"New sound alert (fallback): {sound_alert['description']}")
            
            # Limit the size of our in-memory storage
            if len(mock_db["transcriptions"]) > 100:
                mock_db["transcriptions"] = mock_db["transcriptions"][-50:]
            
            if len(mock_db["sound_alerts"]) > 100:
                mock_db["sound_alerts"] = mock_db["sound_alerts"][-50:]
                
            # Wait before processing next chunk
            time.sleep(3)  # Adjust as needed for demo purposes
            
        except Exception as e:
            logger.error(f"Error in audio processing thread: {str(e)}")
            time.sleep(5)  # Wait longer after an error

# Start the audio processing thread
audio_thread = threading.Thread(target=audio_processing_thread, daemon=True)
audio_thread.start()

# API Routes
@app.route('/api/status', methods=['GET'])
def status():
    """Check the API status and Gemini connectivity."""
    gemini_status = "connected" if model is not None else "disconnected"
    
    return jsonify({
        "status": "online",
        "gemini_api": gemini_status,
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
    
    # Get transcriptions from mock database
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
    
    # Get sound alerts from mock database
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
    if request.method == 'GET':
        # Return mock preferences
        return jsonify(mock_db["user_preferences"])
    
    elif request.method == 'PUT':
        data = request.json
        
        # Update mock preferences
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
            "id": len(mock_db["transcriptions"]) + 1,
            "text": text,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat(),
            "source": "manual_input"
        }
        
        # Add to mock database
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

# Add a simple __main__ block to make it runnable as a standalone script
if __name__ == "__main__":
    # When run directly, start the Flask server
    print("Starting EchoLens.AI backend server...")
    app.run(debug=True, host='0.0.0.0', port=5000) 