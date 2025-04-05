""
Defines the structure for documents stored in MongoDB.
"""

# Schema for the 'chat_sessions' collection
CHAT_SESSION_SCHEMA = {
    "_id": "ObjectId (auto-generated)",
    "session_id": "string (unique)",
    "messages": [
        {
            "role": "string ('user', 'assistant', 'system', or 'agent')",
            "content": "string",
            "timestamp": "datetime"
        }
    ],
    "summary": "string (optional, periodically updated)",
    "created_at": "datetime",
    "updated_at": "datetime"
}

# Schema for the 'tasks' collection (defined for future use)
TASK_SCHEMA = {
    "_id": "ObjectId (auto-generated)",
    "task_id": "string (unique)",
    "session_id": "string (links to chat_sessions)",
    "description": "string",
    "agent_type": "string",
    "status": "string ('pending', 'in_progress', 'completed', 'failed', 'cancelled')",
    "parameters": "object",
    "results": "object",
    "log": [
        {
            "timestamp": "datetime",
            "entry_text": "string"
        }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
}

# Schema for the 'user_data' collection
USER_DATA_SCHEMA = {
    "_id": "ObjectId (auto-generated)",
    "user_id": "string (unique, e.g., linked to auth system or a unique identifier)",
    "profile": {
        "name": "string (optional)",
        "age": "integer (optional)",
        "location": "string (optional)"
        # Add other relevant profile fields
    },
    "preferences": {
        "likes": ["string"], # Array of things the user likes
        "dislikes": ["string"], # Array of things the user dislikes
        "communication_style": "string (optional, e.g., 'formal', 'casual')"
    },
    "experiences": [ # Array of significant experiences or memories shared
        {
            "description": "string",
            "timestamp": "datetime (optional, when it happened or was recorded)",
            "tags": ["string"] # Optional keywords
        }
    ],
    "goals": ["string"], # User's stated goals
    "views": [ # User's expressed views on topics
        {
            "topic": "string",
            "summary": "string",
            "timestamp": "datetime (optional, when expressed)"
        }
    ],
    "created_at": "datetime",
    "updated_at": "datetime"
}
