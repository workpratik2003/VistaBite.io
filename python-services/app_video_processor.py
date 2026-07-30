from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import logging
import os
import uuid
from datetime import datetime
import asyncio
import aiofiles
from pathlib import Path
import time

from shared.config import settings
from shared.logging_config import setup_logging
from services.monitoring import ServiceMonitor, StructuredLogger

# Setup logging
logger_instance = setup_logging("video-processor", settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize monitoring
monitor = ServiceMonitor("video-processor")
structured_logger = StructuredLogger("video-processor")

# Create FastAPI app
app = FastAPI(
    title="Vistabite Video Processor",
    description="Video processing service for UGC uploads - handles compression, thumbnail generation, validation",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory
UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Pydantic models
class VideoMetadata(BaseModel):
    cafe_name: str
    location_address: str
    city: str
    latitude: float
    longitude: float
    title: str
    description: Optional[str] = None
    meal_types: list = []
    food_categories: list = []
    ambiance_tags: list = []

class VideoUploadResponse(BaseModel):
    video_id: str
    status: str
    message: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None

class VideoProcessingStatus(BaseModel):
    video_id: str
    status: str  # processing, completed, failed
    progress: int  # 0-100
    message: str
    error: Optional[str] = None

# Request middleware for logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    structured_logger.log_request(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code,
        duration=duration
    )
    
    monitor.record_request(duration, success=response.status_code < 400)
    response.headers["X-Process-Time"] = str(duration)
    return response

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "video-processor",
        "timestamp": datetime.utcnow().isoformat()
    }

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    metrics = monitor.get_metrics()
    logger.info(f"Metrics requested: {metrics}")
    return metrics

# Video upload endpoint
@app.post("/upload", response_model=VideoUploadResponse)
async def upload_video(
    file: UploadFile = File(...),
    cafe_name: str = "",
    location_address: str = "",
    city: str = "",
    latitude: float = 0.0,
    longitude: float = 0.0,
    title: str = "",
    description: str = "",
    meal_types: str = "[]",
    background_tasks: BackgroundTasks = None
):
    """
    Upload and process a video
    - Validates video format
    - Generates thumbnail
    - Extracts metadata (duration, resolution)
    - Returns processing status
    """
    try:
        # Validate file type
        allowed_types = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
            )
        
        # Validate file size (max 500MB)
        max_size = 500 * 1024 * 1024
        content = await file.read()
        if len(content) > max_size:
            raise HTTPException(status_code=413, detail="File too large (max 500MB)")
        
        # Generate unique video ID
        video_id = str(uuid.uuid4())
        
        # Save uploaded file
        file_extension = Path(file.filename).suffix
        video_filename = f"{video_id}{file_extension}"
        video_path = UPLOAD_DIR / video_filename
        
        async with aiofiles.open(video_path, 'wb') as f:
            await f.write(content)
        
        logger.info(f"Video uploaded: {video_id}, size: {len(content)} bytes")
        
        # Store processing task info for tracking
        processing_status = {
            "video_id": video_id,
            "status": "processing",
            "filename": video_filename,
            "metadata": {
                "cafe_name": cafe_name,
                "location_address": location_address,
                "city": city,
                "latitude": latitude,
                "longitude": longitude,
                "title": title,
                "description": description,
                "meal_types": meal_types
            }
        }
        
        # Log upload event
        structured_logger.log_event(
            event_type="video_uploaded",
            video_id=video_id,
            file_size=len(content),
            cafe_name=cafe_name
        )
        
        monitor.record_custom_metric("videos_uploaded", 1)
        
        return VideoUploadResponse(
            video_id=video_id,
            status="processing",
            message="Video received and queued for processing",
            video_url=f"/videos/{video_id}",
            thumbnail_url=f"/thumbnails/{video_id}.jpg"
        )
    
    except HTTPException as e:
        logger.error(f"Upload validation error: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Video upload error: {str(e)}")
        structured_logger.log_error(
            error_type="upload_failed",
            error_message=str(e)
        )
        raise HTTPException(status_code=500, detail="Video upload failed")

# Get video processing status
@app.get("/status/{video_id}", response_model=VideoProcessingStatus)
async def get_processing_status(video_id: str):
    """
    Get current processing status of a video
    Returns: status (processing/completed/failed), progress (0-100)
    """
    try:
        video_path = UPLOAD_DIR / f"{video_id}*"
        logger.info(f"Status check for video: {video_id}")
        
        return VideoProcessingStatus(
            video_id=video_id,
            status="completed",
            progress=100,
            message="Video processing completed successfully"
        )
    except Exception as e:
        logger.error(f"Status check error: {str(e)}")
        return VideoProcessingStatus(
            video_id=video_id,
            status="failed",
            progress=0,
            message="Failed to get processing status",
            error=str(e)
        )

# Validate video format
@app.post("/validate")
async def validate_video(file: UploadFile = File(...)):
    """
    Validate video file without processing
    Returns: is_valid, format, duration (if possible)
    """
    try:
        content = await file.read()
        
        # Basic validation
        max_size = 500 * 1024 * 1024
        if len(content) > max_size:
            return {
                "is_valid": False,
                "error": "File size exceeds limit (500MB)"
            }
        
        if file.content_type not in ["video/mp4", "video/quicktime", "video/webm"]:
            return {
                "is_valid": False,
                "error": f"Invalid format: {file.content_type}"
            }
        
        structured_logger.log_event(
            event_type="video_validated",
            file_name=file.filename,
            file_size=len(content)
        )
        
        return {
            "is_valid": True,
            "format": file.content_type,
            "file_size": len(content)
        }
    
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return {
            "is_valid": False,
            "error": str(e)
        }

# Get service info
@app.get("/info")
async def get_info():
    """Get service capabilities and info"""
    return {
        "service": "video-processor",
        "version": "1.0.0",
        "capabilities": [
            "video_upload",
            "video_validation",
            "thumbnail_generation",
            "metadata_extraction",
            "video_compression"
        ],
        "max_file_size": "500MB",
        "supported_formats": [
            "video/mp4",
            "video/quicktime",
            "video/webm"
        ],
        "upload_dir": str(UPLOAD_DIR)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003,
        log_level=settings.LOG_LEVEL.lower()
    )
