from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import logging
from services.analytics import analytics
from shared.config import settings
from shared.database import db

# Configure logging
logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Vistabite Analytics Service",
    description="Data processing and analytics service",
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

# Startup/shutdown events
@app.on_event("startup")
async def startup():
    """Connect to database on startup"""
    try:
        await db.connect()
        logger.info("Database connection established")
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")

@app.on_event("shutdown")
async def shutdown():
    """Close database connection on shutdown"""
    await db.disconnect()
    logger.info("Database connection closed")

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    service: str

class ReelData(BaseModel):
    caption: str
    hashtags: List[str] = []
    meal_types: List[str] = []
    restaurant_name: str
    city: str
    quality_score: float
    views: str = "0"
    status: str = "approved"

class BatchAnalyticsRequest(BaseModel):
    submissions: List[ReelData]

# Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "analytics"
    }

@app.post("/trending-meals")
async def get_trending_meals(days: int = Query(7, ge=1, le=90)):
    """Get trending meal types"""
    try:
        logger.info(f"Fetching trending meals for last {days} days")
        
        # Fetch approved submissions from database
        query = """
            SELECT * FROM submissions 
            WHERE status = 'approved' 
            AND created_at > NOW() - INTERVAL '1 day' * $1
            ORDER BY created_at DESC
        """
        
        submissions = await db.execute(query, days)
        
        # Convert meal_types from string to list if needed
        for submission in submissions:
            if isinstance(submission.get('meal_types'), str):
                submission['meal_types'] = submission['meal_types'].strip('[]').split(',')
        
        trending = await analytics.get_trending_meals(submissions, days)
        
        return {
            "trending_meals": trending,
            "period_days": days,
            "generated_at": str(__import__('datetime').datetime.utcnow())
        }
        
    except Exception as e:
        logger.error(f"Error fetching trending meals: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/restaurant-rankings")
async def get_restaurant_rankings(limit: int = Query(20, ge=1, le=100)):
    """Get top-ranked restaurants"""
    try:
        logger.info(f"Fetching top {limit} restaurants")
        
        query = """
            SELECT * FROM submissions 
            WHERE status = 'approved'
            ORDER BY created_at DESC
        """
        
        submissions = await db.execute(query)
        
        # Convert meal_types from string to list if needed
        for submission in submissions:
            if isinstance(submission.get('meal_types'), str):
                submission['meal_types'] = submission['meal_types'].strip('[]').split(',')
        
        rankings = await analytics.get_restaurant_rankings(submissions)
        
        return {
            "rankings": rankings[:limit],
            "total_restaurants": len(rankings),
            "generated_at": str(__import__('datetime').datetime.utcnow())
        }
        
    except Exception as e:
        logger.error(f"Error fetching restaurant rankings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/location-stats")
async def get_location_statistics():
    """Get statistics for all locations"""
    try:
        logger.info("Fetching location statistics")
        
        query = """
            SELECT * FROM submissions 
            WHERE status = 'approved'
        """
        
        submissions = await db.execute(query)
        
        # Convert meal_types from string to list if needed
        for submission in submissions:
            if isinstance(submission.get('meal_types'), str):
                submission['meal_types'] = submission['meal_types'].strip('[]').split(',')
        
        location_stats = await analytics.get_location_stats(submissions)
        
        return {
            "locations": location_stats,
            "total_locations": len(location_stats),
            "generated_at": str(__import__('datetime').datetime.utcnow())
        }
        
    except Exception as e:
        logger.error(f"Error fetching location stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insights")
async def get_content_insights():
    """Get overall content performance insights"""
    try:
        logger.info("Generating content insights")
        
        query = "SELECT * FROM submissions"
        submissions = await db.execute(query)
        
        # Convert meal_types from string to list if needed
        for submission in submissions:
            if isinstance(submission.get('meal_types'), str):
                submission['meal_types'] = submission['meal_types'].strip('[]').split(',')
        
        insights = await analytics.get_content_insights(submissions)
        
        return {
            "insights": insights,
            "generated_at": str(__import__('datetime').datetime.utcnow())
        }
        
    except Exception as e:
        logger.error(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard")
async def get_dashboard_data():
    """Get complete dashboard data"""
    try:
        logger.info("Generating dashboard data")
        
        query = "SELECT * FROM submissions"
        submissions = await db.execute(query)
        
        # Convert meal_types from string to list if needed
        for submission in submissions:
            if isinstance(submission.get('meal_types'), str):
                submission['meal_types'] = submission['meal_types'].strip('[]').split(',')
        
        trending = await analytics.get_trending_meals(submissions)
        rankings = await analytics.get_restaurant_rankings(submissions)
        locations = await analytics.get_location_stats(submissions)
        insights = await analytics.get_content_insights(submissions)
        
        return {
            "trending_meals": trending[:10],
            "top_restaurants": rankings[:10],
            "locations": locations[:10],
            "insights": insights,
            "generated_at": str(__import__('datetime').datetime.utcnow())
        }
        
    except Exception as e:
        logger.error(f"Error generating dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=settings.ANALYTICS_PORT,
        log_level=settings.LOG_LEVEL.lower()
    )
