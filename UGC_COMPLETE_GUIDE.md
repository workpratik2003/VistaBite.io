# Vistabite UGC (User Generated Content) Implementation Guide

## Overview
Transform Vistabite from Instagram reel aggregation to a full UGC platform where users upload their own food videos and posts, with location-based discovery.

---

## Phase 1: Database Schema (COMPLETE)

### Files Created
- `scripts/ugc-schema.sql` - Complete UGC database schema with 10 new tables

### New Tables Created
1. **creator_profiles** - User profiles with follower counts, verification
2. **ugc_videos** - User-uploaded videos with location, meal types, engagement metrics
3. **ugc_likes** - Like engagement tracking
4. **ugc_comments** - Video comments with moderation
5. **ugc_saves** - User save/favorites functionality
6. **creator_follows** - Creator following relationships
7. **ugc_trending_cache** - Cached trending videos by location/category
8. **ugc_moderation_queue** - Content moderation workflow
9. **creator_analytics** - Creator performance metrics

### Key Features
- PostGIS geospatial support for location-based queries
- Indexed for fast searches by location, meal type, trending
- Moderation workflow for content approval
- Engagement metrics (likes, views, comments, saves)

---

## Phase 2: Video Processing Microservice (Port 8003)

### Responsibilities
- Upload video validation
- Thumbnail generation from video
- Video compression/optimization
- Duration extraction
- Metadata processing

### Implementation (Next Steps)
Create `python-services/app_video_processor.py` with:
```python
@app.post("/upload")
async def upload_video(file: UploadFile, metadata: VideoMetadata):
    # Validate video format
    # Generate thumbnail
    # Compress video
    # Return processing status
```

---

## Phase 3: Content Moderation Service (Port 8004)

### Responsibilities
- Flag inappropriate content using Groq vision API
- Check video quality
- Detect explicit content
- Verify location accuracy
- Queue for manual review if needed

### Implementation
Create `python-services/app_moderation.py` with AI-powered analysis

---

## Phase 4: API Routes (Next.js Backend)

### Video Management Routes
```
POST   /api/videos/upload              - Upload new video
GET    /api/videos/[id]                - Get single video
DELETE /api/videos/[id]                - Delete video (creator only)
PATCH  /api/videos/[id]                - Update video metadata
```

### Search Routes
```
GET    /api/videos/search?q=cafe&location=pune&radius=5km&mealType=breakfast
GET    /api/videos/trending?city=pune&mealType=lunch
GET    /api/videos/near-me?lat=19.1234&lng=73.4567&radius=10km
```

### Engagement Routes
```
POST   /api/videos/[id]/like           - Like a video
DELETE /api/videos/[id]/like           - Unlike
POST   /api/videos/[id]/save           - Save video
POST   /api/videos/[id]/comments       - Post comment
GET    /api/videos/[id]/comments       - Get comments
```

### Creator Routes
```
GET    /api/creators/[id]              - Get creator profile
PATCH  /api/creators/[id]              - Update profile
GET    /api/creators/[id]/videos       - Get creator's videos
GET    /api/creators/[id]/analytics    - Creator analytics
POST   /api/creators/[id]/follow       - Follow creator
DELETE /api/creators/[id]/follow       - Unfollow
```

---

## Phase 5: Frontend Components (React)

### Video Upload Component
```tsx
<VideoUploadForm>
  - File upload (drag-drop)
  - Cafe name & address input
  - Location picker (map)
  - Meal type selector
  - Description editor
  - Preview thumbnail
  - Submit button
</VideoUploadForm>
```

### Video Player Component
```tsx
<VideoPlayer video={ugcVideo}>
  - Video player (HLS)
  - Engagement buttons (like, save, share, comment)
  - Creator info card
  - Location info badge
  - Comments section
</VideoPlayer>
```

### Video Feed Component
```tsx
<VideoFeed location={userLocation} mealType={selected}>
  - Infinite scroll feed
  - Videos sorted by trending/recent
  - Distance badge showing km away
  - Engagement metrics
  - Creator name & avatar
</VideoFeed>
```

### Creator Profile Component
```tsx
<CreatorProfile creatorId={id}>
  - Profile header (avatar, bio, stats)
  - Follow/Unfollow button
  - Video grid of creator's content
  - Analytics dashboard (if own profile)
  - Follower/Following lists
</CreatorProfile>
```

---

## Phase 6: Advanced Features

### Recommendation Algorithm
- Collaborative filtering based on likes/saves
- Content-based (similar meal types, locations)
- User preference learning
- Trending content boosting

### Creator Monetization (Future)
- Creator fund payout
- Sponsored video listings
- Premium features
- Ad revenue sharing

### Social Features
- Direct messaging between creators
- Creator verification program
- Badges & achievements
- Creator collaborations

---

## Migration Strategy

### Week 1-2: Deploy Database & Microservices
- Run `ugc-schema.sql` migration
- Deploy video processing service
- Deploy moderation service
- Test with sample uploads

### Week 3-4: Deploy APIs & Basic Frontend
- Implement all API routes
- Create upload form
- Create basic video player
- Test end-to-end flow

### Week 5-6: Deploy Search & Discovery
- Implement geospatial search
- Deploy trending algorithm
- Create video feed
- Add location-based filtering

### Week 7-8: Social & Refinement
- Implement comments & likes
- Create creator profiles
- Add following system
- Performance optimization

### Long-term: Sunset Instagram Integration
- Phase 1 (Month 1): Run both Instagram + UGC reels together
- Phase 2 (Month 2-3): Gradually promote UGC content
- Phase 3 (Month 4-6): Reduce Instagram reel visibility
- Phase 4 (Month 6+): Full migration to UGC only

---

## Technology Stack

### Frontend
- React/Next.js for UI
- react-dropzone for file uploads
- react-player or HLS.js for video playback
- Mapbox for location picker
- Infinite-scroll for feed

### Backend
- FastAPI microservices (Python)
- FFmpeg for video processing
- Groq vision API for moderation
- PostGIS for geospatial queries
- Vercel Blob for video storage

### Database
- PostgreSQL with PostGIS extension
- Indexes on location, meal_type, trending_score
- Proper foreign key constraints
- Cascade deletes for cleanup

---

## Implementation Checklist

### Database
- [ ] Run `ugc-schema.sql` migration
- [ ] Verify PostGIS extension enabled
- [ ] Create necessary indexes
- [ ] Test geospatial queries

### Video Processing (8003)
- [ ] Create service with FFmpeg wrapper
- [ ] Implement thumbnail generation
- [ ] Add video validation
- [ ] Test with sample videos

### Moderation (8004)
- [ ] Integrate Groq vision API
- [ ] Create flagging logic
- [ ] Build moderation queue UI
- [ ] Test with test videos

### APIs
- [ ] Upload endpoint with validation
- [ ] Search/filter endpoints
- [ ] Engagement endpoints (like/comment/save)
- [ ] Creator profile endpoints
- [ ] Analytics endpoints

### Frontend
- [ ] Upload form component
- [ ] Video player component
- [ ] Video feed/grid component
- [ ] Creator profile page
- [ ] Search/filter UI

### Testing
- [ ] Unit tests for services
- [ ] Integration tests for APIs
- [ ] End-to-end upload test
- [ ] Geospatial search test
- [ ] Performance testing

---

## Next Steps to Build

1. **Week 1**: Run database migration & deploy both microservices
2. **Week 2**: Implement all API routes
3. **Week 3**: Build upload form & basic video player
4. **Week 4**: Deploy search & trending features
5. **Week 5+**: Add social features & optimization

Start with Phase 1 database, then Phase 2-3 microservices, then move to frontend components in that order.
