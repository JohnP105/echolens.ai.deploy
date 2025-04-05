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
