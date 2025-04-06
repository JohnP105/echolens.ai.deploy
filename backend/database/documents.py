"""
MongoDB document schemas and data operations for the EchoLens application.
This file defines data models and provides functions to interact with the MongoDB collections.
"""

import logging
from datetime import datetime
from bson import ObjectId
from .dbclient import (
    get_transcriptions_collection,
    get_sound_alerts_collection,
    get_user_preferences_collection,
    get_collection
)

# Set up logging
logger = logging.getLogger(__name__)

# Default user preferences (matches the one in echolens_api.py)
DEFAULT_USER_PREFERENCES = {
    "transcription_enabled": True,
    "sound_detection_enabled": True,
    "emotion_detection_enabled": True,
    "directional_audio": True, 
    "notification_volume": 70,
    "distance_reporting": True,
    "important_sounds": ["doorbell", "alarm", "phone", "name_called"]
}

# Define chat messages collection name
CHAT_MESSAGES_COLLECTION = "chat_messages"

# Functions for Transcription documents
def save_transcription(text, emotion=None, source="automatic", user_id=None):
    """
    Save a new transcription to the database.
    
    Args:
        text (str): The transcribed text
        emotion (str, optional): Detected emotion
        source (str, optional): Source of the transcription (automatic/manual)
        user_id (str, optional): User ID if applicable
    
    Returns:
        ObjectId: ID of the inserted document
    """
    try:
        collection = get_transcriptions_collection()
        
        # Create document
        document = {
            "text": text,
            "emotion": emotion,
            "timestamp": datetime.now().isoformat(),
            "source": source
        }
        
        # Add user_id if provided
        if user_id:
            document["user_id"] = user_id
            
        # Insert document
        result = collection.insert_one(document)
        logger.info(f"Saved transcription: '{text[:30]}...' with ID {result.inserted_id}")
        
        return result.inserted_id
    except Exception as e:
        logger.error(f"Error saving transcription: {str(e)}")
        raise

def get_transcriptions(limit=10, page=1, emotion=None, user_id=None):
    """
    Get transcriptions with pagination and filtering options.
    
    Args:
        limit (int): Number of items per page
        page (int): Page number (1-indexed)
        emotion (str, optional): Filter by emotion
        user_id (str, optional): Filter by user ID
    
    Returns:
        dict: Paginated results with metadata
    """
    try:
        collection = get_transcriptions_collection()
        
        # Build query filter
        query = {}
        if emotion:
            query["emotion"] = emotion
        if user_id:
            query["user_id"] = user_id
            
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = collection.count_documents(query)
        
        # Get paginated results
        cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        
        # Convert cursor to list
        transcriptions = list(cursor)
        
        # Convert ObjectId to string for JSON serialization
        for item in transcriptions:
            if "_id" in item:
                item["_id"] = str(item["_id"])
                
        logger.info(f"Retrieved {len(transcriptions)} transcriptions (page {page}, limit {limit})")
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "transcriptions": transcriptions
        }
    except Exception as e:
        logger.error(f"Error getting transcriptions: {str(e)}")
        raise

# Functions for Sound Alert documents
def save_sound_alert(sound_type, description, direction, distance, priority, category=None, user_id=None):
    """
    Save a new sound alert to the database.
    
    Args:
        sound_type (str): Type of sound detected
        description (str): Human-readable description
        direction (str): Direction of the sound
        distance (str): Estimated distance
        priority (str): Priority level (high/medium/low)
        category (str, optional): Sound category
        user_id (str, optional): User ID if applicable
    
    Returns:
        ObjectId: ID of the inserted document
    """
    try:
        collection = get_sound_alerts_collection()
        
        # Create document
        document = {
            "soundType": sound_type,
            "description": description,
            "direction": direction,
            "distance": distance,
            "priority": priority, 
            "timestamp": datetime.now().isoformat()
        }
        
        # Add optional fields if provided
        if category:
            document["category"] = category
        if user_id:
            document["user_id"] = user_id
            
        # Insert document
        result = collection.insert_one(document)
        logger.info(f"Saved sound alert: '{description}' with ID {result.inserted_id}")
        
        return result.inserted_id
    except Exception as e:
        logger.error(f"Error saving sound alert: {str(e)}")
        raise

def get_sound_alerts(limit=10, page=1, priority=None, sound_type=None, user_id=None):
    """
    Get sound alerts with pagination and filtering options.
    
    Args:
        limit (int): Number of items per page
        page (int): Page number (1-indexed)
        priority (str, optional): Filter by priority level
        sound_type (str, optional): Filter by sound type
        user_id (str, optional): Filter by user ID
    
    Returns:
        dict: Paginated results with metadata
    """
    try:
        collection = get_sound_alerts_collection()
        
        # Build query filter
        query = {}
        if priority:
            query["priority"] = priority
        if sound_type:
            query["soundType"] = sound_type
        if user_id:
            query["user_id"] = user_id
            
        # Calculate skip for pagination
        skip = (page - 1) * limit
        
        # Get total count for pagination
        total = collection.count_documents(query)
        
        # Get paginated results
        cursor = collection.find(query).sort("timestamp", -1).skip(skip).limit(limit)
        
        # Convert cursor to list
        sound_alerts = list(cursor)
        
        # Convert ObjectId to string for JSON serialization
        for item in sound_alerts:
            if "_id" in item:
                item["_id"] = str(item["_id"])
                
        logger.info(f"Retrieved {len(sound_alerts)} sound alerts (page {page}, limit {limit})")
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "soundAlerts": sound_alerts
        }
    except Exception as e:
        logger.error(f"Error getting sound alerts: {str(e)}")
        raise

# Functions for User Preferences
def get_user_preferences(user_id="default"):
    """
    Get user preferences or create with defaults if not exist.
    
    Args:
        user_id (str): User identifier
    
    Returns:
        dict: User preferences
    """
    try:
        collection = get_user_preferences_collection()
        
        # Try to find existing preferences
        preferences = collection.find_one({"user_id": user_id})
        
        # If no preferences exist, create with defaults
        if not preferences:
            logger.info(f"No preferences found for user {user_id}, creating defaults")
            preferences = DEFAULT_USER_PREFERENCES.copy()
            preferences["user_id"] = user_id
            preferences["created_at"] = datetime.now().isoformat()
            preferences["updated_at"] = datetime.now().isoformat()
            
            collection.insert_one(preferences)
            logger.info(f"Created default preferences for user {user_id}")
        else:
            # Convert ObjectId to string for JSON serialization
            if "_id" in preferences:
                preferences["_id"] = str(preferences["_id"])
                
        return preferences
    except Exception as e:
        logger.error(f"Error getting user preferences: {str(e)}")
        raise

def update_user_preferences(preferences, user_id="default"):
    """
    Update user preferences.
    
    Args:
        preferences (dict): New preferences to apply
        user_id (str): User identifier
    
    Returns:
        dict: Updated preferences
    """
    try:
        collection = get_user_preferences_collection()
        
        # Set update timestamp
        preferences["updated_at"] = datetime.now().isoformat()
        
        # Update existing preferences
        result = collection.update_one(
            {"user_id": user_id},
            {"$set": preferences},
            upsert=True
        )
        
        if result.matched_count > 0:
            logger.info(f"Updated preferences for user {user_id}")
        else:
            logger.info(f"Created preferences for new user {user_id}")
            
        # Get the updated document
        updated = collection.find_one({"user_id": user_id})
        
        # Convert ObjectId to string for JSON serialization
        if "_id" in updated:
            updated["_id"] = str(updated["_id"])
            
        return updated
    except Exception as e:
        logger.error(f"Error updating user preferences: {str(e)}")
        raise

# Functions for Chat Messages
def save_chat_message(message, response, context=None, user_id="default"):
    """
    Save a chat message exchange between user and Gemini AI.
    
    Args:
        message (str): User's message
        response (str): Gemini AI's response
        context (dict, optional): Context information like emotional state or environment
        user_id (str, optional): User identifier
    
    Returns:
        ObjectId: ID of the inserted document
    """
    try:
        collection = get_collection(CHAT_MESSAGES_COLLECTION)
        
        # Create document
        document = {
            "user_id": user_id,
            "message": message,
            "response": response,
            "timestamp": datetime.now().isoformat()
        }
        
        # Add context if provided
        if context:
            document["context"] = context
            
        # Insert document
        result = collection.insert_one(document)
        logger.info(f"Saved chat message: '{message[:30]}...' with ID {result.inserted_id}")
        
        return result.inserted_id
    except Exception as e:
        logger.error(f"Error saving chat message: {str(e)}")
        raise

def get_chat_history(limit=20, user_id="default"):
    """
    Get chat message history for a user.
    
    Args:
        limit (int): Maximum number of messages to retrieve
        user_id (str): User identifier
    
    Returns:
        list: Chat message history
    """
    try:
        collection = get_collection(CHAT_MESSAGES_COLLECTION)
        
        # Get chat messages for user, most recent first
        cursor = collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        
        # Convert cursor to list
        messages = list(cursor)
        
        # Convert ObjectId to string for JSON serialization
        for item in messages:
            if "_id" in item:
                item["_id"] = str(item["_id"])
                
        logger.info(f"Retrieved {len(messages)} chat messages for user {user_id}")
        
        # Return in chronological order (oldest first)
        return sorted(messages, key=lambda x: x["timestamp"])
    except Exception as e:
        logger.error(f"Error getting chat history: {str(e)}")
        raise

def clear_chat_history(user_id="default"):
    """
    Clear chat history for a user.
    
    Args:
        user_id (str): User identifier
    
    Returns:
        int: Number of deleted messages
    """
    try:
        collection = get_collection(CHAT_MESSAGES_COLLECTION)
        
        # Delete all messages for the user
        result = collection.delete_many({"user_id": user_id})
        deleted_count = result.deleted_count
        
        logger.info(f"Cleared {deleted_count} chat messages for user {user_id}")
        
        return deleted_count
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise
