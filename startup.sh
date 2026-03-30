#!/bin/bash
cd /home/site/wwwroot
pip install -r requirements.txt
gunicorn application:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000 --timeout 120
