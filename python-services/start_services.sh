#!/bin/bash

# Vistabite Python Microservices Startup Script

set -e

echo "Starting Vistabite Python Microservices..."

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Create shared package
touch shared/__init__.py

# Start content analyzer service
echo "Starting Content Analyzer Service on port 8001..."
python -m uvicorn app_content_analyzer:app --host 0.0.0.0 --port 8001 &
ANALYZER_PID=$!

# Start analytics service
echo "Starting Analytics Service on port 8002..."
python -m uvicorn app_analytics:app --host 0.0.0.0 --port 8002 &
ANALYTICS_PID=$!

echo "Services started:"
echo "  Content Analyzer: http://localhost:8001"
echo "  Analytics: http://localhost:8002"
echo "  Docs: http://localhost:8001/docs and http://localhost:8002/docs"

# Wait for services to finish
wait $ANALYZER_PID $ANALYTICS_PID
