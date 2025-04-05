from pymongo import MongoClient
import os
import logging
from dotenv import load_dotenv
import os.path
from pymongo.errors import ConnectionFailure

# Determine the path to the .env file (one level up)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')

# Load the .env file
load_dotenv(dotenv_path=dotenv_path)

# Set up logging
logging.basicConfig(level=logging.DEBUG) # Configures root logger
logger = logging.getLogger(__name__) # Get logger for this module

# Ensure logger propagates to root logger configured in app.py
logger.propagate = True

BRAIN_DB_NAME = "brain" # Hardcode the target database name

# Global variables for client and db (consider alternatives for larger apps)
_client = None
_db = None

def get_db():
    """Initializes the MongoDB client and returns the database object."""
    global _client, _db

    # Return existing connection if already established
    if _db is not None:
        # logger.debug("Returning existing DB connection.") # Optional: Log reuse
        return _db

    logger.info("Attempting to load MONGODB_URI...") # Log before accessing env var
    MONGODB_URI = os.environ.get('MONGODB_URI')

    if not MONGODB_URI:
        logger.error("MONGODB_URI not found. Make sure it's set in the .env file or environment variables.")
        raise ValueError("MONGODB_URI not found in environment variables.") # Raise instead of exit
    else:
        logger.info("MONGODB_URI loaded successfully.")

    try:
        logger.info(f"Attempting to connect to MongoDB URI: {MONGODB_URI[:15]}...{MONGODB_URI[-5:]}") # Log URI partially
        _client = MongoClient(MONGODB_URI,
                            serverSelectionTimeoutMS=5000)

        # The ismaster command is cheap and does not require auth.
        logger.info("Pinging MongoDB server...")
        _client.admin.command('ping') # Use ping instead of ismaster
        logger.info("MongoDB connection successful (ping successful).")

        # Check if the target 'brain' database exists for logging purposes
        try:
            logger.debug("Checking for existence of 'brain' database...")
            db_names = _client.list_database_names()
            if BRAIN_DB_NAME in db_names:
                logger.info(f"Database '{BRAIN_DB_NAME}' found in cluster.")
            else:
                logger.info(f"Database '{BRAIN_DB_NAME}' not found. It will be created automatically on first write.")
        except Exception as e:
            # This might fail due to permissions, but connection is likely still okay
            logger.warning(f"Could not list database names (permissions issue?): {e}. Proceeding assuming connection is valid.")

        # Get the database handle (MongoDB creates it implicitly if it doesn't exist)
        _db = _client[BRAIN_DB_NAME]
        logger.info(f"Using database instance: '{BRAIN_DB_NAME}'")

        # Optional: Check if DB actually exists or will be created on first write
        # try:
        #     logger.debug("Listing database names...")
        #     db_names = _client.list_database_names()
        #     if DB_NAME in db_names:
        #         logger.info(f"Database '{DB_NAME}' already exists.")
        #     else:
        #         logger.info(f"Database '{DB_NAME}' will be created on first write.")
        # except Exception as e:
        #     logger.warning(f"Could not list database names (permissions?): {e}")

        return _db

    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed (ConnectionFailure): {e}")
        raise ConnectionFailure(f"MongoDB connection failed: {e}") # Raise instead of exit
    except Exception as e:
        logger.error(f"An unexpected error occurred during DB connection: {e}")
        raise Exception(f"An unexpected error occurred during DB connection: {e}") # Raise instead of exit

# Note: The code below this line (the previous direct connection logic) is removed.