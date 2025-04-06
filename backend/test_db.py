"""
Test script to verify database connection and logging.
Run this script directly to test database functionality.
"""

import os
import sys
import logging
from datetime import datetime

# Configure logging
log_file_path = os.path.abspath('echolens.log')
# Clear the log file
with open(log_file_path, 'w') as f:
    f.write(f"=== Database Test Started at {datetime.now().isoformat()} ===\n")

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(log_file_path)
    ]
)
logger = logging.getLogger(__name__)
logger.info(f"Database test script started - logging to {log_file_path}")

# Import database modules
try:
    from database.dbclient import (
        get_db, 
        get_transcriptions_collection, 
        get_sound_alerts_collection,
        get_user_preferences_collection
    )
    from database.documents import (
        save_transcription,
        save_sound_alert,
        update_user_preferences,
        DEFAULT_USER_PREFERENCES
    )
    logger.info("Successfully imported database modules")
except Exception as e:
    logger.error(f"Failed to import database modules: {e}")
    sys.exit(1)

def test_database_connection():
    """Test basic database connectivity."""
    logger.info("Testing database connection...")
    
    try:
        # Get database connection
        db = get_db()
        logger.info(f"Connected to database: {db.name}")
        
        # Try to list all collections
        collections = db.list_collection_names()
        logger.info(f"Collections in database: {collections}")
        
        return True
    except Exception as e:
        logger.error(f"Database connection test failed: {e}")
        return False

def create_sample_data():
    """Create sample data in all collections."""
    logger.info("Creating sample data in collections...")
    
    try:
        # 1. Insert sample transcriptions
        transcription_ids = []
        sample_transcriptions = [
            {"text": "Hello, can you hear me clearly?", "emotion": "neutral", "source": "automatic"},
            {"text": "There's someone at the door.", "emotion": "surprise", "source": "automatic"},
            {"text": "The fire alarm is going off!", "emotion": "fear", "source": "automatic"}
        ]
        
        for t in sample_transcriptions:
            doc_id = save_transcription(t["text"], t["emotion"], t["source"])
            transcription_ids.append(doc_id)
            logger.info(f"Created transcription with ID: {doc_id}")
            
        # 2. Insert sample sound alerts
        alert_ids = []
        sample_alerts = [
            {"sound_type": "doorbell", "description": "Doorbell ringing", "direction": "front", 
             "distance": "close", "priority": "high", "category": "notification"},
            {"sound_type": "alarm", "description": "Fire alarm detected", "direction": "kitchen", 
             "distance": "medium", "priority": "high", "category": "emergency"},
            {"sound_type": "phone", "description": "Phone ringing", "direction": "bedroom", 
             "distance": "far", "priority": "medium", "category": "notification"}
        ]
        
        for a in sample_alerts:
            doc_id = save_sound_alert(
                a["sound_type"], a["description"], a["direction"], 
                a["distance"], a["priority"], a["category"]
            )
            alert_ids.append(doc_id)
            logger.info(f"Created sound alert with ID: {doc_id}")
            
        # 3. Insert user preferences
        user_prefs = DEFAULT_USER_PREFERENCES.copy()
        user_prefs["notification_volume"] = 80
        user_prefs["important_sounds"] = ["doorbell", "alarm", "phone", "baby_crying", "glass_breaking"]
        
        updated_prefs = update_user_preferences(user_prefs)
        logger.info(f"Created user preferences: {updated_prefs}")
        
        return {
            "transcription_ids": transcription_ids,
            "alert_ids": alert_ids,
            "preferences": updated_prefs
        }
    except Exception as e:
        logger.error(f"Failed to create sample data: {e}")
        return None

def verify_sample_data(sample_data):
    """Verify the sample data was inserted correctly."""
    logger.info("Verifying sample data...")
    
    try:
        # Get collection handles
        transcriptions = get_transcriptions_collection()
        sounds = get_sound_alerts_collection()
        preferences = get_user_preferences_collection()
        
        # Check transcriptions
        for doc_id in sample_data["transcription_ids"]:
            doc = transcriptions.find_one({"_id": doc_id})
            if doc:
                logger.info(f"Found transcription: {doc['text'][:30]}...")
            else:
                logger.error(f"Transcription with ID {doc_id} not found!")
                
        # Check sound alerts
        for doc_id in sample_data["alert_ids"]:
            doc = sounds.find_one({"_id": doc_id})
            if doc:
                logger.info(f"Found sound alert: {doc['description']}")
            else:
                logger.error(f"Sound alert with ID {doc_id} not found!")
                
        # Check user preferences
        prefs = preferences.find_one({"user_id": "default"})
        if prefs:
            logger.info(f"Found user preferences with volume: {prefs['notification_volume']}")
        else:
            logger.error("User preferences not found!")
            
        # Count documents in each collection
        transcriptions_count = transcriptions.count_documents({})
        sounds_count = sounds.count_documents({})
        preferences_count = preferences.count_documents({})
        
        logger.info(f"Collection counts - Transcriptions: {transcriptions_count}, "
                   f"Sound Alerts: {sounds_count}, "
                   f"User Preferences: {preferences_count}")
        
        return True
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("===============================")
    logger.info("Starting database tests")
    logger.info("===============================")
    
    # Run connection test
    db_connected = test_database_connection()
    
    if db_connected:
        # Create sample data in collections
        sample_data = create_sample_data()
        
        if sample_data:
            # Verify the data was inserted correctly
            data_verified = verify_sample_data(sample_data)
            
            if data_verified:
                logger.info("All database tests passed!")
                logger.info("Check MongoDB Atlas GUI to see the inserted data.")
                logger.info("The data has been inserted into the 'echolens' database")
                logger.info("in collections: 'transcriptions', 'sound_alerts', and 'user_preferences'")
            else:
                logger.error("Data verification failed!")
        else:
            logger.error("Failed to create sample data!")
    else:
        logger.error("Database connection test failed!")
    
    logger.info("===============================")
    logger.info("Database tests completed")
    logger.info("===============================") 