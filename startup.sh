#!/bin/bash
cd /home/site/wwwroot
pip install -r backend/requirements.txt
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
