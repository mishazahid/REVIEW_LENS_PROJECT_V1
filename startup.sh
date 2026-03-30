#!/bin/bash
# Azure App Service startup script
# Serves both the FastAPI backend and React static files from a single process

cd /home/site/wwwroot

# Install Python dependencies
pip install -r backend/requirements.txt

# Build frontend if dist doesn't exist
if [ ! -d "frontend/dist" ]; then
    cd frontend
    npm install
    npm run build
    cd ..
fi

# Start FastAPI (serves both API and React static files)
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
