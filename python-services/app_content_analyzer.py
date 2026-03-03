from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import time
from services.content_analyzer import ContentAnalyzer
from services.monitoring import ServiceMonitor, StructuredLogger
from shared.config import settings
from shared.logging_config import setup_logging

# Configure logging
logger_instance = setup_logging("content-analyzer", settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

# Initialize monitoring
monitor = ServiceMonitor("content-analyzer")
structured_logger = StructuredLogger("content-analyzer")

app = FastAPI(
    title="Vistabite Content Analyzer",
    description="AI-powered reel content analysis service",
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

# Add request timing middleware
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

# Initialize content analyzer
analyzer = ContentAnalyzer(settings.GROQ_API_KEY)

# Pydantic models
class ReelAnalysisRequest(BaseModel):
    caption: str
    hashtags: List[str] = []
    thumbnail_url: Optional[str] = None

class BatchAnalysisRequest(BaseModel):
    reels: List[ReelAnalysisRequest]

class HealthResponse(BaseModel):
    status: str
    service: str

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "content-analyzer"
    }

@app.post("/analyze-reel")
async def analyze_reel(request: ReelAnalysisRequest):
    """Analyze a single reel for food relevance and metadata"""
    try:
        logger.info(f"Analyzing reel: {request.caption[:50]}...")
        
        analysis = await analyzer.analyze_reel(
            caption=request.caption,
            hashtags=request.hashtags,
            thumbnail_url=request.thumbnail_url
        )
        
        # Calculate overall score
        score = analyzer.score_reel(analysis)
        analysis['overall_score'] = score
        
        logger.info(f"Analysis complete. Score: {score}")
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing reel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-batch")
async def analyze_batch(request: BatchAnalysisRequest):
    """Analyze multiple reels concurrently"""
    try:
        logger.info(f"Batch analyzing {len(request.reels)} reels...")
        
        reels_data = [reel.dict() for reel in request.reels]
        analyses = await analyzer.batch_analyze(reels_data)
        
        # Add overall scores
        results = []
        for analysis in analyses:
            score = analyzer.score_reel(analysis)
            analysis['overall_score'] = score
            results.append(analysis)
        
        logger.info(f"Batch analysis complete")
        return {"results": results, "count": len(results)}
        
    except Exception as e:
        logger.error(f"Error in batch analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/models")
async def get_available_models():
    """Get information about available AI models"""
    return {
        "primary_model": "mixtral-8x7b-32768",
        "provider": "groq",
        "capabilities": [
            "food_relevance_detection",
            "meal_type_classification",
            "cuisine_detection",
            "quality_scoring",
            "hashtag_analysis"
        ]
    }

@app.get("/metrics")
async def get_metrics():
    """Get service health and performance metrics"""
    metrics = monitor.get_metrics()
    logger.info(f"Metrics requested: {metrics}")
    return metrics

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.CONTENT_ANALYSIS_PORT,
        log_level=settings.LOG_LEVEL.lower()
    )
