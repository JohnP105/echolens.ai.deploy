FROM python:3.9-slim

# Install system dependencies including PortAudio and C++ build tools
RUN apt-get update && apt-get install -y \
    portaudio19-dev \
    python3-pyaudio \
    libsndfile1 \
    ffmpeg \
    build-essential \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the entire repository (we'll be using the backend folder)
COPY . .

# Install Python dependencies
RUN pip install --no-cache-dir -r backend/requirements.txt

# Set environment variables
ENV PORT=10000
ENV FLASK_ENV=production

# Expose the port
EXPOSE 10000

# Change to backend directory and run the application
WORKDIR /app/backend
CMD ["python", "echolens_api.py"] 