# Vistabite Deployment Guide

Complete guide for deploying Vistabite with Python microservices.

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│         Next.js Frontend (Vercel)                   │
│  - React Components                                 │
│  - User Interface (Vistabite)                       │
│  - Database Management (Neon)                       │
└──────────────────┬──────────────────────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────┐
    │  Next.js API Routes (Port 3000)  │
    │  - /api/submit-reel              │
    │  - /api/analyze-content          │
    │  - /api/analytics/*              │
    └──────────────────┬───────────────┘
                       │
        ┌──────────────┴──────────────┐
        ↓                             ↓
    ┌─────────────────┐    ┌──────────────────┐
    │ Content         │    │ Analytics Service│
    │ Analyzer        │    │ (FastAPI 8002)   │
    │ (FastAPI 8001)  │    │                  │
    └────────┬────────┘    └────────┬─────────┘
             │                      │
             └──────────┬───────────┘
                        ↓
              ┌──────────────────┐
              │ PostgreSQL       │
              │ Database (Neon)  │
              └──────────────────┘
```

## Deployment Options

### Option 1: Local Development (Docker)

**Quick Start**:
```bash
# Clone repository
git clone <repo-url>
cd vistabite

# Create .env files
cp python-services/.env.example python-services/.env
# Edit python-services/.env with your GROQ_API_KEY

# Start all services with Docker Compose
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Content Analyzer: http://localhost:8001/docs
# Analytics: http://localhost:8002/docs
```

**Stop services**:
```bash
docker-compose down
```

### Option 2: Vercel + Railway (Recommended Production)

**Step 1: Deploy Frontend to Vercel**

1. Push code to GitHub
2. Go to https://vercel.com/new
3. Import repository
4. Set environment variables:
   ```
   NEXT_PUBLIC_CONTENT_ANALYZER_URL=https://your-analyzer.railway.app
   NEXT_PUBLIC_ANALYTICS_URL=https://your-analytics.railway.app
   DATABASE_URL=postgresql://... (from Neon)
   RAPIDAPI_KEY=...
   GROQ_API_KEY=...
   RESEND_API_KEY=...
   ```
5. Deploy

**Step 2: Deploy Python Microservices to Railway**

1. Go to https://railway.app
2. Create new project
3. Connect your GitHub repository
4. Add PostgreSQL plugin
5. Configure start command:
   ```
   cd python-services && sh start_services.sh
   ```
6. Set environment variables:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   GROQ_API_KEY=your_key
   FRONTEND_URL=https://your-vercel-app.vercel.app
   CONTENT_ANALYSIS_PORT=8001
   ANALYTICS_PORT=8002
   ```
7. Deploy

**Step 3: Update Vercel Environment Variables**

After Railway deployment, update Vercel env vars with actual Railway URLs.

### Option 3: AWS Deployment

**Components**:
- **Frontend**: AWS Amplify or CloudFront + S3
- **Backend**: EC2 or ECS for microservices
- **Database**: RDS PostgreSQL

**Steps**:
1. Build Next.js app: `npm run build`
2. Deploy to Amplify
3. Create EC2 instance for Python services
4. Use RDS for database
5. Configure security groups and networking

### Option 4: Google Cloud Run

**Deploy Python services**:
```bash
# Create Dockerfile (already included)
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/vistabite-services

# Deploy
gcloud run deploy vistabite-services \
  --image gcr.io/PROJECT_ID/vistabite-services \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=...,GROQ_API_KEY=...
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_CONTENT_ANALYZER_URL=http://localhost:8001
NEXT_PUBLIC_ANALYTICS_URL=http://localhost:8002
DATABASE_URL=postgresql://...
RAPIDAPI_KEY=...
GROQ_API_KEY=...
RESEND_API_KEY=...
```

### Python Services (python-services/.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/vistabite
GROQ_API_KEY=your_groq_key
CONTENT_ANALYSIS_PORT=8001
ANALYTICS_PORT=8002
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=INFO
```

## Database Setup

### Local PostgreSQL
```sql
-- Create database
createdb vistabite

-- Run migrations
psql vistabite < scripts/init-db.sql
```

### Neon (Cloud PostgreSQL)
1. Create account at https://neon.tech
2. Create project
3. Get connection string
4. Set as DATABASE_URL

## Monitoring

### Local
```bash
# Check service health
curl http://localhost:8001/health
curl http://localhost:8002/health

# View metrics
curl http://localhost:8001/metrics
curl http://localhost:8002/metrics

# View logs
tail -f logs/content-analyzer.log
tail -f logs/analytics.log
```

### Cloud
- Railway: Dashboard shows logs and metrics
- AWS CloudWatch: Monitor EC2 and services
- Google Cloud Logging: View Cloud Run logs

## Performance Optimization

### Frontend
- Enable Next.js image optimization
- Use lazy loading for components
- Implement code splitting

### Backend
- Database connection pooling (already configured)
- Async database operations
- Request caching with Redis (optional)

### Microservices
- Batch processing for multiple reels
- Async operations with asyncio
- Database indexing for common queries

## Security

### API Keys
- Never commit .env files
- Use environment variables
- Rotate keys regularly

### Database
- Use strong passwords
- Enable SSL connections
- Regular backups
- Restrict network access

### Services
- CORS configured for frontend only
- HTTPS in production
- Input validation
- Rate limiting (optional)

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql postgresql://user:password@host/database

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Service Not Starting
```bash
# Check logs
docker-compose logs python-services

# Verify ports are free
lsof -i :8001
lsof -i :8002
```

### API Errors
1. Check service health: `/health` endpoints
2. View metrics: `/metrics` endpoints
3. Check logs in `logs/` directory
4. Verify environment variables

### Slow Performance
1. Check database query performance
2. Monitor service metrics
3. Check network latency
4. Review logs for errors

## Scaling

### Horizontal Scaling
- Deploy multiple instances behind load balancer
- Use database connection pooling
- Implement caching layer

### Vertical Scaling
- Increase instance resources
- Upgrade database tier
- Optimize code

## Backup & Recovery

### Database Backups
```bash
# Local backup
pg_dump vistabite > backup.sql

# Restore
psql vistabite < backup.sql

# Cloud backups
# Neon: Automatic daily backups
# AWS RDS: Automated snapshots
```

## Cost Estimation

### Monthly Costs
- **Vercel**: $0-20 (free tier + pro)
- **Railway**: $5-50 (pay-as-you-go)
- **Neon PostgreSQL**: $0-100 (free tier available)
- **Groq API**: Free tier available
- **Resend**: $20+ (email sending)
- **Total**: ~$50-200/month for production

## Support

- Check logs in `logs/` directory
- Review GitHub issues
- Check service documentation:
  - http://localhost:8001/docs (Content Analyzer)
  - http://localhost:8002/docs (Analytics)
