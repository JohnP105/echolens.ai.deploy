from pymongo import MongoClient
import os
import logging
from dotenv import load_dotenv
import os.path

# Determine the path to the .env file (one level up)
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')

# Load the .env file
load_dotenv(dotenv_path=dotenv_path)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

MONGODB_URI = os.environ.get('MONGODB_URI') # Use .get() for safer access

if not MONGODB_URI:
    logger.error("MONGODB_URI not found. Make sure it's set in the .env file or environment variables.")
    exit(1)

client = MongoClient(MONGODB_URI)

# List all the databases in the cluster:
for db_info in client.list_database_names():
    print(db_info)

    