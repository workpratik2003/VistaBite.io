# Vistabite Python Microservices

FastAPI-based microservices for AI content analysis and data analytics.

## Services

### 1. Content Analyzer Service (Port 8001)
- **Purpose**: AI-powered analysis of reel content
- **Features**:
  - Food relevance detection
  - Meal type classification
  - Cuisine detection
  - Quality scoring
  - Batch processing

**Endpoints**:
- `POST /analyze-reel` - Analyze a single reel
- `POST /analyze-batch` - Analyze multiple reels
- `GET /health` - Health check
- `GET /models` - Available AI models

### 2. Analytics Service (Port 8002)
- **Purpose**: Data processing and analytics
- **Features**:
  - Trending meal types
  - Restaurant rankings
  - Location statistics
  - Content insights
  - Dashboard data

**Endpoints**:
- `POST /trending-meals` - Get trending meal types
- `POST /restaurant-rankings` - Get top restaurants
- `POST /location-stats` - Get location statistics
- `GET /insights` - Content performance insights
- `GET /dashboard` - Complete dashboard data
- `GET /health` - Health check

## Setup

### Prerequisites
- Python 3.9+
- PostgreSQL database
- Groq API key

### Installation

1. **Install dependencies**:
```bash
cd python-services
pip install -r requirements.txt
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set environment variables**:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/vistabite"
export GROQ_API_KEY="your_groq_api_key"
export FRONTEND_URL="http://localhost:3000"
```

### Running Services

**Option 1: Use startup script**
```bash
chmod +x start_services.sh
./start_services.sh
```

**Option 2: Run manually**
```bash
# Terminal 1 - Content Analyzer
python -m uvicorn app_content_analyzer:app --reload --port 8001

# Terminal 2 - Analytics
python -m uvicorn app_analytics:app --reload --port 8002
```

## API Documentation

Once running, access interactive API docs:
- Content Analyzer: http://localhost:8001/docs
- Analytics: http://localhost:8002/docs

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/vistabite
GROQ_API_KEY=your_groq_api_key
CONTENT_ANALYSIS_PORT=8001
ANALYTICS_PORT=8002
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=INFO
```

## Architecture

```
Next.js Frontend (Port 3000)
        ↓
┌───────┴───────┐
│               │
▼               ▼
Content      Analytics
Analyzer     Service
Service      (8002)
(8001)
│               │
└───────┬───────┘
        ↓
   PostgreSQL
   Database
```

## Integration with Next.js

Use the microservices client in your Next.js app:

```typescript
import { contentAnalyzerService, analyticsService } from '@/lib/microservices'

// Analyze a reel
const analysis = await contentAnalyzerService.analyzeReel(
  caption,
  hashtags,
  thumbnailUrl
)

// Get trending meals
const trending = await analyticsService.getTrendingMeals(7)

// Get dashboard data
const dashboard = await analyticsService.getDashboard()
```

## Development

### Running with hot reload
```bash
pip install uvicorn[standard]
python -m uvicorn app_content_analyzer:app --reload
```

### Database Migrations
Ensure your database has the `submissions` table with these columns:
- id (UUID)
- restaurant_name (VARCHAR)
- creator_name (VARCHAR)
- creator_email (VARCHAR)
- instagram_url (VARCHAR)
- meal_types (VARCHAR)
- city (VARCHAR)
- restaurant_address (VARCHAR)
- reel_description (TEXT)
- quality_score (FLOAT)
- views (VARCHAR)
- status (VARCHAR: pending/approved/rejected)
- created_at (TIMESTAMP)

## Deployment

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["sh", "start_services.sh"]
```

Build and run:
```bash
docker build -t vistabite-services .
docker run -p 8001:8001 -p 8002:8002 --env-file .env vistabite-services
```

### Cloud Deployment

Deploy on:
- Heroku
- Railway
- Render
- AWS EC2
- Google Cloud Run
- Azure Container Instances

## Monitoring

Monitor service health:
```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
```

## Troubleshooting

**Database connection issues**:
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure network connectivity

**AI analysis failures**:
- Verify GROQ_API_KEY is valid
- Check internet connectivity
- Review Groq API quota

**CORS errors**:
- Verify FRONTEND_URL matches your frontend origin
- Check CORS middleware configuration

## Contributing

To add new endpoints or services:
1. Create new service file in `services/`
2. Add FastAPI routes in appropriate app file
3. Update microservices client in Next.js
4. Document in this README

## License

MIT
