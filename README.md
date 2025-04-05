# RoboMind – Emotion-Aware Companion Robot

RoboMind is an emotion-aware companion robot application that helps users track their emotional well-being and provides personalized support based on their emotional state.

## Features

- **Emotion Analysis**: Analyzes user emotions through text input
- **Chat Interface**: Provides a supportive chat experience
- **Personalized Recommendations**: Offers suggestions based on detected emotions
- **Customizable Settings**: Allows users to tailor their experience

## Getting Started

### Prerequisites

- Python 3.8+ 
- pip (Python package manager)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/robomind.git
cd robomind
```

2. Set up the Gemini API (optional, but recommended for enhanced functionality):
   - Get a Gemini API key from [Google AI Studio](https://ai.google.dev/)
   - Update the API key in the `.env` file in the `backend` directory:
     ```
     GEMINI_API_KEY=your-api-key-here
     ```

3. Run the application:
```
python run_app.py
```

This will:
- Install all required dependencies
- Start the backend server on http://localhost:5000
- Start the frontend server on http://localhost:3000
- Open the application in your default web browser

## Using the Application

### Dashboard
The dashboard provides an overview of your current emotional state and quick links to the main features of the application.

### Emotion Analysis
Use this section to analyze your emotions:
1. Enter text describing how you're feeling
2. Click "Analyze My Emotions"
3. View the analysis results, including:
   - Detected emotion
   - Emotion intensity
   - Personalized suggestion

### Chat Interface
Engage in a supportive conversation:
1. Type messages in the input field
2. RoboMind will respond with empathetic and helpful messages
3. The system considers your emotional context from emotion analysis (if available)

### Settings
Customize your experience:
- **Accessibility**: Adjust text size, enable high contrast, etc.
- **Language**: Select your preferred language
- **Privacy**: Manage conversation history and data collection

## Running the Backend Only

To run just the backend API:

```
cd backend
python api.py
```

The API will be available at http://localhost:5000 with endpoints:
- `GET /api/health`: Health check endpoint
- `POST /api/analyze-text`: Analyze text for emotions
- `POST /api/chat`: Chat interface

## Architecture

RoboMind consists of:

1. **Backend**: Flask-based API that handles:
   - Emotion analysis (with Google Gemini AI when available)
   - Chat responses
   - Health monitoring

2. **Frontend**: Simple HTML/CSS/JS interface that provides:
   - User dashboard
   - Emotion analysis UI
   - Chat interface
   - Settings management

## Contributors

- [Your Name](https://github.com/yourusername)

## License

This project is licensed under the MIT License - see the LICENSE file for details.