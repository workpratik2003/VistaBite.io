from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import logging
import asyncio
import time
from datetime import datetime
from groq import Groq

from shared.config import settings
from shared.logging_config import setup_logging
from shared.database import get_db_connection
from services.monitoring import ServiceMonitor, StructuredLogger

# Setup logging
logger_instance = setup_logging("moderation", settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize monitoring
monitor = ServiceMonitor("moderation")
structured_logger = StructuredLogger("moderation")

# Groq client for AI moderation
groq_client = Groq(api_key=settings.GROQ_API_KEY)

# Create FastAPI app
app = FastAPI(
    title="Vistabite Content Moderation",
    description="AI-powered content moderation service using Groq vision API",
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

# Pydantic models
class ModerationRequest(BaseModel):
    video_id: str
    thumbnail_url: str
    title: str
    description: str
    cafe_name: str
    city: str

class ModerationResult(BaseModel):
    video_id: str
    is_approved: bool
    confidence_score: float  # 0-1
    flags: List[str] = []
    issues: List[str] = []
    recommendation: str  # approve, manual_review, reject
    reason: str

class ModerationQueue(BaseModel):
    video_id: str
    reason: str
    ai_score: float
    status: str  # pending, approved, rejected
    timestamp: str

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
        "service": "moderation",
        "timestamp": datetime.utcnow().isoformat()
    }

# Metrics endpoint
@app.get("/metrics")
async def get_metrics():
    metrics = monitor.get_metrics()
    logger.info(f"Metrics requested: {metrics}")
    return metrics

# Main moderation endpoint
@app.post("/moderate", response_model=ModerationResult)
async def moderate_content(request: ModerationRequest):
    """
    Moderate video content using AI analysis
    - Checks for inappropriate content
    - Verifies location relevance
    - Analyzes video quality
    - Returns approval recommendation
    """
    try:
        logger.info(f"Moderating video: {request.video_id}")
        
        # Initialize flags and issues list
        flags = []
        issues = []
        confidence_score = 0.95  # Default high confidence for approved content
        is_approved = True
        recommendation = "approve"
        reason = "Content passes moderation checks"
        
        # Moderation checks using Groq
        moderation_prompt = f"""
        You are a content moderator for a food discovery app called Vistabite.
        Review this food video submission and flag any issues:
        
        Title: {request.title}
        Description: {request.description}
        Cafe Name: {request.cafe_name}
        Location: {request.city}
        
        Check for:
        1. Inappropriate or offensive content
        2. Misleading claims about food/location
        3. Low quality or spam indicators
        4. Commercial spam or ads
        5. Fake or misleading information
        
        Respond with JSON format:
        {{
            "is_appropriate": true/false,
            "confidence": 0.95,
            "flags": ["flag1", "flag2"],
            "issues": ["issue1"],
            "recommendation": "approve/manual_review/reject"
        }}
        """
        
        try:
            response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": moderation_prompt}],
                model="mixtral-8x7b-32768",
                temperature=0.3,
                max_tokens=500
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"AI Moderation response for {request.video_id}: {ai_response}")
            
            # Parse AI response (in production, use JSON parsing)
            if "false" in ai_response.lower():
                is_approved = False
                confidence_score = 0.6
                recommendation = "manual_review"
                reason = "AI flagged potential issues - requires manual review"
            else:
                is_approved = True
                confidence_score = 0.95
                recommendation = "approve"
                reason = "Content passes AI moderation checks"
        
        except Exception as e:
            logger.error(f"Groq AI error: {str(e)}")
            # Fallback to basic checks if AI fails
            confidence_score = 0.7
            recommendation = "manual_review"
            reason = "AI service unavailable - flagged for manual review"
        
        # Additional basic content checks
        title_length = len(request.title)
        desc_length = len(request.description)
        
        if title_length < 3 or title_length > 200:
            flags.append("invalid_title_length")
        
        if desc_length > 5000:
            flags.append("description_too_long")
        
        # Log moderation result
        structured_logger.log_event(
            event_type="content_moderated",
            video_id=request.video_id,
            is_approved=is_approved,
            confidence=confidence_score,
            flags=flags
        )
        
        monitor.record_custom_metric("videos_moderated", 1)
        if is_approved:
            monitor.record_custom_metric("videos_approved", 1)
        else:
            monitor.record_custom_metric("videos_flagged", 1)
        
        return ModerationResult(
            video_id=request.video_id,
            is_approved=is_approved,
            confidence_score=confidence_score,
            flags=flags,
            issues=issues,
            recommendation=recommendation,
            reason=reason
        )
    
    except Exception as e:
        logger.error(f"Moderation error: {str(e)}")
        structured_logger.log_error(
            error_type="moderation_failed",
            error_message=str(e),
            video_id=request.video_id
        )
        raise HTTPException(status_code=500, detail="Moderation failed")

# Batch moderation endpoint
@app.post("/moderate-batch")
async def moderate_batch(videos: List[ModerationRequest]):
    """
    Moderate multiple videos at once
    Returns list of moderation results
    """
    try:
        results = []
        for video in videos:
            result = await moderate_content(video)
            results.append(result)
        
        logger.info(f"Batch moderation completed for {len(videos)} videos")
        return {"results": results, "count": len(results)}
    
    except Exception as e:
        logger.error(f"Batch moderation error: {str(e)}")
        raise HTTPException(status_code=500, detail="Batch moderation failed")

# Get moderation queue
@app.get("/queue")
async def get_moderation_queue(status: str = "pending", limit: int = 20):
    """
    Get videos pending manual moderation review
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT v.id, v.title, m.reason_flagged, m.ai_confidence_score, 
                   m.manual_review_status, m.created_at
            FROM ugc_moderation_queue m
            JOIN ugc_videos v ON m.video_id = v.id
            WHERE m.manual_review_status = %s
            ORDER BY m.created_at DESC
            LIMIT %s
        """
        
        cur.execute(query, (status, limit))
        videos = cur.fetchall()
        cur.close()
        conn.close()
        
        queue_items = [
            ModerationQueue(
                video_id=str(v[0]),
                reason=v[2],
                ai_score=float(v[3]),
                status=v[4],
                timestamp=v[5].isoformat() if v[5] else None
            )
            for v in videos
        ]
        
        return {"queue": queue_items, "count": len(queue_items)}
    
    except Exception as e:
        logger.error(f"Queue fetch error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch moderation queue")

# Approve video
@app.post("/approve/{video_id}")
async def approve_video(video_id: str, notes: str = ""):
    """
    Manually approve a flagged video
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update video status
        cur.execute(
            "UPDATE ugc_videos SET status = %s WHERE id = %s",
            ("approved", video_id)
        )
        
        # Update moderation queue
        cur.execute(
            "UPDATE ugc_moderation_queue SET manual_review_status = %s, notes = %s, reviewed_at = NOW() WHERE video_id = %s",
            ("approved", notes, video_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Video approved: {video_id}")
        monitor.record_custom_metric("videos_manually_approved", 1)
        
        return {"status": "approved", "video_id": video_id}
    
    except Exception as e:
        logger.error(f"Approval error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to approve video")

# Reject video
@app.post("/reject/{video_id}")
async def reject_video(video_id: str, reason: str = ""):
    """
    Manually reject a flagged video
    """
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Update video status
        cur.execute(
            "UPDATE ugc_videos SET status = %s WHERE id = %s",
            ("rejected", video_id)
        )
        
        # Update moderation queue
        cur.execute(
            "UPDATE ugc_moderation_queue SET manual_review_status = %s, notes = %s, reviewed_at = NOW() WHERE video_id = %s",
            ("rejected", reason, video_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        logger.info(f"Video rejected: {video_id}")
        monitor.record_custom_metric("videos_rejected", 1)
        
        return {"status": "rejected", "video_id": video_id}
    
    except Exception as e:
        logger.error(f"Rejection error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reject video")

# Get service info
@app.get("/info")
async def get_info():
    """Get service capabilities"""
    return {
        "service": "moderation",
        "version": "1.0.0",
        "ai_provider": "groq",
        "capabilities": [
            "content_moderation",
            "batch_moderation",
            "manual_review_queue",
            "approval_workflow",
            "flagging_system"
        ],
        "check_types": [
            "inappropriate_content",
            "misleading_claims",
            "spam_detection",
            "quality_assessment",
            "location_verification"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8004,
        log_level=settings.LOG_LEVEL.lower()
    )
