from pymongo import MongoClient
import os
import logging
from dotenv import load_dotenv
import os.path
from pymongo.errors import ConnectionFailure
import sys

# Determine the path to the .env file (one level up)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')

# Load the .env file
load_dotenv(dotenv_path=dotenv_path)

# Ensure the logger is properly set up regardless of how this module is imported
log_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'echolens.log'))
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Check if this logger already has handlers
if not logger.handlers:
    # Create handlers
    console_handler = logging.StreamHandler(sys.stdout)
    file_handler = logging.FileHandler(log_file_path)
    
    # Create formatter
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    
    # Set formatter for handlers
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)
    
    # Add handlers to logger
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

# Always log a startup message to confirm logging is working
logger.info("Database module initialized with dedicated logger")

ECHOLENS_DB_NAME = "echolens" # Database name for the EchoLens application

# Define collection names
TRANSCRIPTIONS_COLLECTION = "transcriptions"
SOUND_ALERTS_COLLECTION = "sound_alerts"
USER_PREFERENCES_COLLECTION = "user_preferences"

# Global variables for client and db (consider alternatives for larger apps)
_client = None
_db = None
_collections = {}

def get_db():
    """Initializes the MongoDB client and returns the database object."""
    global _client, _db

    # Return existing connection if already established
    if _db is not None:
        logger.debug("Returning existing DB connection.")
        return _db

    logger.info("Attempting to load MONGODB_URI...") # Log before accessing env var
    MONGODB_URI = os.environ.get('MONGODB_URI')

    if not MONGODB_URI:
        logger.error("MONGODB_URI not found. Make sure it's set in the .env file or environment variables.")
        raise ValueError("MONGODB_URI not found in environment variables.") # Raise instead of exit
    
    logger.info("MONGODB_URI loaded successfully.")
    # Log a snippet of the URI without exposing credentials
    uri_parts = MONGODB_URI.split('@')
    if len(uri_parts) > 1:
        # Only log the host part of the URI for security
        logger.debug(f"MongoDB URI host part: {uri_parts[1]}")
    else:
        logger.warning("MongoDB URI doesn't have the expected format (username:password@host).")

    try:
        logger.info(f"Attempting to connect to MongoDB URI: {MONGODB_URI[:15]}...{MONGODB_URI[-5:]}")
        logger.debug("Creating MongoDB client with 5000ms serverSelectionTimeout")
        _client = MongoClient(MONGODB_URI,
                            serverSelectionTimeoutMS=5000)

        # The ping command is cheap and does not require auth.
        logger.info("Pinging MongoDB server...")
        try:
            _client.admin.command('ping') # Use ping instead of ismaster
            logger.info("MongoDB connection successful (ping successful).")
        except Exception as e:
            logger.error(f"MongoDB ping failed: {e}")
            if "Connection refused" in str(e):
                logger.error("Connection refused - MongoDB server may not be running or network connection issue.")
            elif "auth failed" in str(e).lower():
                logger.error("Authentication failed - check username and password in connection string.")
            raise # Re-raise to be caught by the outer try-except

        # Check if the target 'echolens' database exists for logging purposes
        try:
            logger.debug(f"Checking for existence of '{ECHOLENS_DB_NAME}' database...")
            db_names = _client.list_database_names()
            if ECHOLENS_DB_NAME in db_names:
                logger.info(f"Database '{ECHOLENS_DB_NAME}' found in cluster.")
            else:
                logger.info(f"Database '{ECHOLENS_DB_NAME}' not found. It will be created automatically on first write.")
            
            # Log all available databases for debugging
            logger.debug(f"All available databases: {', '.join(db_names)}")
        except Exception as e:
            # This might fail due to permissions, but connection is likely still okay
            logger.warning(f"Could not list database names (permissions issue?): {e}. Proceeding assuming connection is valid.")

        # Get the database handle (MongoDB creates it implicitly if it doesn't exist)
        _db = _client[ECHOLENS_DB_NAME]
        logger.info(f"Using database instance: '{ECHOLENS_DB_NAME}'")

        return _db

    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed (ConnectionFailure): {e}")
        raise ConnectionFailure(f"MongoDB connection failed: {e}") # Raise instead of exit
    except Exception as e:
        logger.error(f"An unexpected error occurred during DB connection: {e}")
        raise Exception(f"An unexpected error occurred during DB connection: {e}") # Raise instead of exit

def get_collection(collection_name):
    """Get a collection by name, creating it if it doesn't exist."""
    global _collections
    
    # Return cached collection if available
    if collection_name in _collections:
        logger.debug(f"Returning cached collection '{collection_name}'")
        return _collections[collection_name]
    
    # Get database connection
    logger.debug(f"Getting database connection for collection '{collection_name}'")
    db = get_db()
    
    # Check if collection exists
    logger.debug(f"Checking if collection '{collection_name}' exists")
    try:
        collection_names = db.list_collection_names()
        collection_exists = collection_name in collection_names
        logger.debug(f"All available collections: {', '.join(collection_names)}")
        
        if not collection_exists:
            logger.info(f"Collection '{collection_name}' doesn't exist yet. It will be created on first write.")
        else:
            logger.info(f"Using existing collection: '{collection_name}'")
    except Exception as e:
        logger.warning(f"Error checking collection existence: {e}")
        collection_exists = False
    
    # Get collection (MongoDB creates it implicitly if it doesn't exist)
    logger.debug(f"Getting collection handle for '{collection_name}'")
    collection = db[collection_name]
    
    # Cache for future use
    _collections[collection_name] = collection
    logger.debug(f"Collection '{collection_name}' cached for future use")
    
    return collection

def get_transcriptions_collection():
    """Get the transcriptions collection."""
    return get_collection(TRANSCRIPTIONS_COLLECTION)

def get_sound_alerts_collection():
    """Get the sound alerts collection."""
    return get_collection(SOUND_ALERTS_COLLECTION)

def get_user_preferences_collection():
    """Get the user preferences collection."""
    return get_collection(USER_PREFERENCES_COLLECTION)