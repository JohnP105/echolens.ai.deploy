import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai
import logging
from datetime import datetime, timezone

# --- Import database connection ---
from .database.dbclient import get_db

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Initialize Database Connection ---
try:
    db = get_db()
    # Define collection names
    CHAT_HISTORY_COLLECTION = "chat_history"
    USER_DATA_COLLECTION = "user_data" # Define user data collection name
    DB_AVAILABLE = True
    # Use the main logger configured in app.py
    logger = logging.getLogger(__name__)
    logger.info("Database connection established and chat_history collection defined.")

    # Also log definition for user_data collection
    if DB_AVAILABLE:
        try:
            user_data_collection = db[USER_DATA_COLLECTION]
            logger.info(f"User data collection ('{USER_DATA_COLLECTION}') defined. Will be created on first write if not present.")
            # If you wanted to ensure its creation/add sample data, do it here
            # Example: user_data_collection.update_one({"user_id": "test-user"}, {"$set": {"profile.name": "Test User"}}, upsert=True)
        except Exception as e:
             logger.error(f"Error accessing user data collection '{USER_DATA_COLLECTION}': {e}")

    # --- Insert Sample Data for Testing ---
    if DB_AVAILABLE:
        try:
            logger.info("Attempting to insert sample chat data for testing...")
            chat_collection = db[CHAT_HISTORY_COLLECTION]
            sample_session_id = "test-session-123"
            sample_messages = [
                {
                    "role": "user",
                    "content": "Hello RoboMind!",
                    "timestamp": datetime.now(timezone.utc)
                },
                {
                    "role": "assistant",
                    "content": "Hello! How can I assist you today?",
                    "timestamp": datetime.now(timezone.utc)
                }
            ]

            # Use update_one with upsert to avoid duplicates if app restarts
            result = chat_collection.update_one(
                {"session_id": sample_session_id},
                {
                    "$set": {
                        "messages": sample_messages,
                        "updated_at": datetime.now(timezone.utc)
                    },
                    "$setOnInsert": {"created_at": datetime.now(timezone.utc)}
                },
                upsert=True
            )

            if result.upserted_id:
                logger.info(f"Successfully inserted sample chat data with session_id: '{sample_session_id}'.")
            elif result.modified_count > 0:
                logger.info(f"Successfully updated existing sample chat data with session_id: '{sample_session_id}'.")
            else:
                logger.info(f"Sample chat data for session_id '{sample_session_id}' already exists and was not modified.")

        except Exception as e:
            logger.error(f"Failed to insert/update sample chat data: {e}")
    # --- End Insert Sample Data ---

except Exception as e:
    logger = logging.getLogger(__name__)
    logger.error(f"FATAL: Database connection failed during Flask app initialization: {e}")
    db = None
    DB_AVAILABLE = False

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-api-key-here":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro-exp-03-25",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
            }
        )
        GEMINI_AVAILABLE = True
        print("Gemini API initialized successfully")
    except Exception as e:
        print(f"Error initializing Gemini API: {e}")
        GEMINI_AVAILABLE = False
else:
    print("Gemini API key not found. Running with basic functionality.")
    GEMINI_AVAILABLE = False

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint to check if the API is running."""
    return jsonify({
        "status": "healthy", 
        "message": "RoboMind API is running",
        "gemini_available": GEMINI_AVAILABLE,
        "database_available": DB_AVAILABLE
    })

@app.route('/api/analyze-text', methods=['POST'])
def analyze_text():
    """Analyze text for sentiment and emotion."""
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    # Use Gemini if available
    if GEMINI_AVAILABLE:
        try:
            prompt = f"""
            Analyze the following text for emotions and sentiment. 
            Identify the primary emotion (joy, sadness, anger, fear, surprise, disgust), 
            the sentiment (positive, negative, neutral), and the intensity (low, medium, high).
            Also provide a brief suggestion for a mental health response.
            
            Text: "{text}"
            
            Format your response as JSON with the following structure:
            {{
                "emotion": "primary emotion",
                "sentiment": "overall sentiment",
                "intensity": "intensity level",
                "suggestion": "brief mental health suggestion"
            }}
            """
            
            response = model.generate_content(prompt)
            try:
                # Try to parse JSON from the response
                result = json.loads(response.text)
                return jsonify(result)
            except json.JSONDecodeError:
                # If not a valid JSON, fall back to keyword matching
                print("Gemini response was not valid JSON. Falling back to keyword matching.")
                return keyword_analysis(text)
        except Exception as e:
            error_message = f"Error with Gemini API in analyze_text: {str(e)}"
            print(error_message)
            
            # Log more detailed error information
            import traceback
            print(f"Exception details: {traceback.format_exc()}")
            
            return keyword_analysis(text)
    else:
        # Fall back to keyword matching
        return keyword_analysis(text)

def keyword_analysis(text):
    """Simple keyword matching for emotion analysis."""
    text = text.lower()
    
    # Default values
    emotion = "neutral"
    sentiment = "neutral"
    intensity = "low"
    
    # Check for emotional keywords
    if any(word in text for word in ["happy", "joy", "glad", "great", "wonderful"]):
        emotion = "happy"
        sentiment = "positive"
        intensity = "medium"
    elif any(word in text for word in ["excited", "thrilled", "enthusiastic"]):
        emotion = "happy"
        sentiment = "positive"
        intensity = "high"
    elif any(word in text for word in ["sad", "unhappy", "depressed", "down"]):
        emotion = "sad"
        sentiment = "negative"
        intensity = "medium"
    elif any(word in text for word in ["angry", "mad", "frustrated", "annoyed"]):
        emotion = "angry"
        sentiment = "negative"
        intensity = "high"
    elif any(word in text for word in ["anxious", "worried", "nervous", "stress"]):
        emotion = "fear"
        sentiment = "negative"
        intensity = "medium"
    elif any(word in text for word in ["calm", "peaceful", "relaxed"]):
        emotion = "neutral"
        sentiment = "positive"
        intensity = "low"
    elif any(word in text for word in ["tired", "exhausted", "sleepy"]):
        emotion = "neutral"
        sentiment = "negative"
        intensity = "low"
    
    # Generate suggestions based on emotion
    suggestions = {
        "happy": "Great to see you happy! This is a good time to reflect on what brings you joy.",
        "sad": "It's okay to feel sad sometimes. Consider doing an activity you enjoy or talking with someone you trust.",
        "angry": "When feeling angry, taking a moment to breathe deeply can help manage the intensity.",
        "fear": "Anxiety is a normal response. Try to identify what's triggering this feeling and consider if there are steps you can take.",
        "neutral": "This is a good opportunity for mindfulness and reflection on your current state."
    }
    
    suggestion = suggestions.get(emotion, "Remember to take deep breaths and practice mindfulness when you need a moment of calm.")
    
    result = {
        "emotion": emotion,
        "sentiment": sentiment,
        "intensity": intensity,
        "suggestion": suggestion
    }
    
    return jsonify(result)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Chat endpoint that responds to user input with mental health support."""
    data = request.json
    message = data.get('message', '')
    context = data.get('context', {})
    session_id = data.get('session_id') # Assuming frontend sends a session ID
    
    # Validate session_id (important!)
    if not session_id:
        logger.warning("Chat request received without session_id.")
        return jsonify({"error": "session_id is required"}), 400

    if not message:
        return jsonify({"error": "No message provided"}), 400
    
    # --- Save User Message to DB ---
    if DB_AVAILABLE:
        try:
            chat_collection = db[CHAT_HISTORY_COLLECTION]
            user_message_doc = {
                "role": "user",
                "content": message,
                "timestamp": datetime.now(timezone.utc) # Use UTC timezone
            }
            result = chat_collection.update_one(
                {"session_id": session_id},
                {
                    "$push": {"messages": user_message_doc},
                    "$setOnInsert": {"created_at": datetime.now(timezone.utc)}, # Set creation time only on insert
                    "$set": {"updated_at": datetime.now(timezone.utc)} # Update last modified time
                },
                upsert=True # Create session if it doesn't exist
            )
            if result.upserted_id:
                logger.info(f"Created new chat session '{session_id}' and saved user message.")
            elif result.modified_count > 0:
                logger.info(f"Added user message to existing session '{session_id}'.")
            else:
                 logger.warning(f"User message DB update for session '{session_id}' resulted in no change (modified_count=0, upserted_id=None).")

            # Note: Retrieving history for context is not implemented here yet.
            # We would add a find_one call here if needed for the LLM prompt.

        except Exception as e:
            logger.error(f"Database error saving user message for session '{session_id}': {e}")
            # Decide how to handle DB errors - maybe proceed without saving?
    # --- End Save User Message ---

    # Use Gemini if available
    if GEMINI_AVAILABLE:
        try:
            emotional_context = ""
            if context and context.get('emotion'):
                emotional_context = f"""
                User's emotional context:
                Emotion: {context.get('emotion', 'unknown')}
                Sentiment: {context.get('sentiment', 'unknown')}
                Intensity: {context.get('intensity', 'unknown')}
                """
                
            prompt = f"""
            As RoboMind, a compassionate AI mental health companion, respond to the following message.
            
            User's message: "{message}"
            
            {emotional_context}
            
            Provide a thoughtful, supportive response that acknowledges their feelings and offers helpful guidance.
            Keep your response conversational and empathetic. Limit to 2-3 sentences.
            """
            
            response = model.generate_content(prompt)
            
            response_text = response.text

            # --- Save Gemini Assistant Response to DB ---
            if DB_AVAILABLE:
                try:
                    assistant_message_doc = {
                        "role": "assistant",
                        "content": response_text,
                        "timestamp": datetime.now(timezone.utc)
                    }
                    result = chat_collection.update_one(
                        {"session_id": session_id},
                        {
                            "$push": {"messages": assistant_message_doc},
                            "$set": {"updated_at": datetime.now(timezone.utc)}
                         }
                        # No upsert needed here, session should exist from user message
                    )
                    if result.modified_count > 0:
                        logger.info(f"Saved Gemini response to session '{session_id}'.")
                    else:
                        logger.warning(f"Gemini response DB update for session '{session_id}' resulted in no change.")
                except Exception as e:
                    logger.error(f"Database error saving Gemini response for session '{session_id}': {e}")
            # --- End Save Gemini Response ---

            return jsonify({"response": response_text})
        except Exception as e:
            error_message = f"Error with Gemini API: {str(e)}"
            print(error_message)
            
            # Log more detailed error information
            import traceback
            print(f"Exception details: {traceback.format_exc()}")
            
            # Try to get available models for debugging
            try:
                available_models = "Models could not be retrieved"
                if hasattr(genai, "list_models"):
                    models_list = genai.list_models()
                    available_models = ", ".join([m.name for m in models_list])
                print(f"Available models: {available_models}")
            except Exception as model_error:
                print(f"Could not list available models: {model_error}")
                
            return rule_based_chat(message, context)
    else:
        # Fall back to rule-based responses
        rule_based_response_json = rule_based_chat(message, context)
        response_data = rule_based_response_json.get_json()
        response_text = response_data.get('response', "Sorry, I couldn't process that.")

        # --- Save Rule-Based Assistant Response to DB ---
        if DB_AVAILABLE:
            try:
                chat_collection = db[CHAT_HISTORY_COLLECTION]
                assistant_message_doc = {
                    "role": "assistant",
                    "content": response_text,
                    "timestamp": datetime.now(timezone.utc)
                }
                result = chat_collection.update_one(
                    {"session_id": session_id},
                    {
                        "$push": {"messages": assistant_message_doc},
                        "$set": {"updated_at": datetime.now(timezone.utc)}
                    }
                    # No upsert needed here, session should exist from user message
                )
                if result.modified_count > 0:
                    logger.info(f"Saved rule-based response to session '{session_id}'.")
                else:
                     logger.warning(f"Rule-based response DB update for session '{session_id}' resulted in no change.")
            except Exception as e:
                logger.error(f"Database error saving rule-based response for session '{session_id}': {e}")
        # --- End Save Rule-Based Response ---

        return rule_based_response_json # Return the original JSON response

def rule_based_chat(message, context):
    """Simple rule-based chat responses."""
    message = message.lower()
    
    # Check for greetings
    if any(word in message for word in ["hello", "hi", "hey", "greetings"]):
        response = "Hello! How are you feeling today?"
    
    # Check for emotion statements
    elif any(word in message for word in ["happy", "good", "great", "wonderful"]):
        response = "I'm glad to hear you're feeling positive! What's contributing to your good mood today?"
    
    elif any(word in message for word in ["sad", "unhappy", "depressed", "down"]):
        response = "I'm sorry you're feeling down. Remember that it's okay to feel this way, and these emotions will pass. Would you like to talk about what's causing these feelings?"
    
    elif any(word in message for word in ["angry", "mad", "frustrated", "annoyed"]):
        response = "I understand you're feeling frustrated. Taking deep breaths can help calm your mind. Would you like to try a quick breathing exercise together?"
    
    elif any(word in message for word in ["anxious", "worried", "nervous", "stress"]):
        response = "Anxiety can be difficult to manage. Let's try to break down what's causing your worry. Is there a specific situation that's making you feel this way?"
    
    elif any(word in message for word in ["tired", "exhausted", "sleepy"]):
        response = "It sounds like you need some rest. Ensuring adequate sleep and downtime is important for mental health. Can I suggest some relaxation techniques?"
    
    # Check for questions about capabilities
    elif any(word in message for word in ["what can you do", "help me", "how does this work"]):
        response = "I'm designed to be a supportive companion. I can chat with you about how you're feeling, provide suggestions for mental health support, and offer a listening ear. How can I help you today?"
    
    # Use context from emotional state if available
    elif context and context.get('emotion') != 'neutral':
        emotion = context.get('emotion')
        if emotion == 'happy':
            response = "I can see you're in a good mood! It's wonderful to experience positive emotions. Would you like to discuss ways to maintain this feeling?"
        elif emotion == 'sad':
            response = "I notice you might be feeling down. Sometimes talking about our feelings can help. Would you like to share what's on your mind?"
        elif emotion == 'angry':
            response = "I can tell you might be feeling frustrated. Taking a moment to reflect can be helpful. What would help you feel more at ease right now?"
        else:
            response = "I notice your emotional state. How can I support you right now?"
    
    # Default responses
    else:
        responses = [
            "I'm here to support you. How else can I help today?",
            "Could you tell me more about how you're feeling?",
            "Thank you for sharing. What would be most helpful for you right now?",
            "I'm listening. Would you like to explore some coping strategies together?",
            "Your well-being matters. What small step could you take today to care for yourself?"
        ]
        import random
        response = random.choice(responses)
    
    result = {
        "response": response
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=4000) 