import cv2
import numpy as np
from deepface import DeepFace
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmotionDetector:
    """
    Class for detecting emotions from facial images using DeepFace and OpenCV.
    Can be integrated with OM1 for edge inference in the future.
    """
    
    def __init__(self):
        """Initialize the emotion detector with necessary models."""
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        logger.info("Emotion detector initialized")
        
    def detect_faces(self, image):
        """
        Detect faces in the given image.
        
        Args:
            image: numpy array of the image
            
        Returns:
            List of face regions (x, y, w, h)
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30)
            )
            return faces
        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []
    
    def analyze_emotion(self, image):
        """
        Analyze emotions in faces detected in the image.
        
        Args:
            image: numpy array of the image
            
        Returns:
            List of dictionaries with emotion analysis for each face
        """
        faces = self.detect_faces(image)
        results = []
        
        for (x, y, w, h) in faces:
            try:
                face_img = image[y:y+h, x:x+w]
                analysis = DeepFace.analyze(
                    face_img, 
                    actions=['emotion'],
                    enforce_detection=False
                )
                
                # Extract emotion data
                emotion_data = analysis[0] if isinstance(analysis, list) else analysis
                dominant_emotion = emotion_data['dominant_emotion']
                emotion_scores = emotion_data['emotion']
                
                result = {
                    'dominant_emotion': dominant_emotion,
                    'emotion_scores': emotion_scores,
                    'face_position': (x, y, w, h)
                }
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error analyzing face: {str(e)}")
                continue
                
        return results
    
    def get_mental_health_suggestion(self, emotion):
        """
        Get a mental health suggestion based on the detected emotion.
        
        Args:
            emotion: Detected dominant emotion
            
        Returns:
            String suggestion for mental health support
        """
        suggestions = {
            'angry': "Take a deep breath and count to 10. Try to identify what's triggering your anger.",
            'disgust': "Focus on something pleasant or neutral to reset your emotional state.",
            'fear': "Practice grounding techniques: name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste.",
            'happy': "Savor this positive feeling, and consider journaling what contributed to this happiness.",
            'sad': "It's okay to feel sad. Consider reaching out to a friend or practicing self-care.",
            'surprise': "Take a moment to process this unexpected information or event.",
            'neutral': "This is a good time for mindfulness meditation or reflection."
        }
        
        return suggestions.get(emotion.lower(), "Take a moment to check in with yourself and practice self-care.")
    
    def process_webcam_feed(self, callback=None):
        """
        Process webcam feed in real-time to detect emotions.
        
        Args:
            callback: Optional callback function to handle emotion results
        """
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Detect emotions
            emotion_results = self.analyze_emotion(frame)
            
            # Draw rectangles around faces
            for result in emotion_results:
                x, y, w, h = result['face_position']
                emotion = result['dominant_emotion']
                
                # Draw rectangle
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                
                # Put text with emotion
                cv2.putText(
                    frame, 
                    emotion, 
                    (x, y-10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.9, 
                    (36, 255, 12), 
                    2
                )
            
            # Display the resulting frame
            cv2.imshow('Emotion Detection', frame)
            
            # Call callback if provided
            if callback and emotion_results:
                callback(emotion_results)
            
            # Break the loop on 'q' key press
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        # Release resources
        cap.release()
        cv2.destroyAllWindows()

# Simple usage example
if __name__ == "__main__":
    detector = EmotionDetector()
    
    def print_emotions(results):
        for result in results:
            print(f"Detected emotion: {result['dominant_emotion']}")
            print(f"Suggestion: {detector.get_mental_health_suggestion(result['dominant_emotion'])}")
    
    detector.process_webcam_feed(callback=print_emotions) 