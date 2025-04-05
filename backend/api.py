import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY and GEMINI_API_KEY != "your-gemini-api-key-here":
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel(
            model_name="gemini-pro",
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
        "gemini_available": GEMINI_AVAILABLE
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
            print(f"Error with Gemini API: {e}")
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
    
    if not message:
        return jsonify({"error": "No message provided"}), 400
    
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
            return jsonify({"response": response.text})
        except Exception as e:
            print(f"Error with Gemini API: {e}")
            return rule_based_chat(message, context)
    else:
        # Fall back to rule-based responses
        return rule_based_chat(message, context)

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
    
    return jsonify({"response": response})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 