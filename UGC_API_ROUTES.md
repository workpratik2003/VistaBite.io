# Vistabite UGC API Routes Documentation

## Video Upload & Management

### POST /api/ugc/videos/upload
Upload a new user-generated video
```typescript
Request:
{
  file: File (multipart form data)
  cafe_name: string
  location_address: string
  city: string
  latitude: number
  longitude: number
  title: string
  description: string
  meal_types: string[] // e.g. ["breakfast", "lunch"]
  food_categories: string[] // e.g. ["Italian", "Indian"]
  ambiance_tags: string[] // e.g. ["cozy", "modern"]
}

Response:
{
  success: boolean
  video_id: string (UUID)
  status: "processing" | "pending_review"
  message: string
}
```

### GET /api/ugc/videos/:videoId
Get single video details with engagement metrics
```typescript
Response:
{
  id: string
  creator_id: string
  title: string
  description: string
  video_url: string
  thumbnail_url: string
  duration_seconds: number
  cafe_name: string
  location_address: string
  city: string
  latitude: number
  longitude: number
  meal_types: string[]
  food_categories: string[]
  ambiance_tags: string[]
  views: number
  likes: number
  comments_count: number
  shares: number
  saves: number
  status: "approved" | "pending" | "rejected"
  created_at: string
  creator: {
    id: string
    username: string
    profile_picture_url: string
    follower_count: number
  }
}
```

### PATCH /api/ugc/videos/:videoId
Update video metadata (creator only)
```typescript
Request:
{
  title?: string
  description?: string
  meal_types?: string[]
  food_categories?: string[]
  ambiance_tags?: string[]
}

Response: { success: boolean, message: string }
```

### DELETE /api/ugc/videos/:videoId
Delete video (creator only)
```typescript
Response: { success: boolean, message: string }
```

---

## Video Search & Discovery

### GET /api/ugc/videos/search
Search videos by location and filters
```typescript
Query Parameters:
- q: string (search query - cafe name, city)
- latitude: number (user latitude)
- longitude: number (user longitude)
- radius: number (search radius in km, default 5)
- city: string (city name)
- mealType: string (breakfast, lunch, dinner, etc.)
- foodCategory: string (Italian, Indian, etc.)
- sortBy: "trending" | "recent" | "nearest" | "popular" (default: "trending")
- page: number (pagination, default: 1)
- limit: number (results per page, default: 20)

Response:
{
  success: boolean
  videos: [
    {
      id: string
      title: string
      thumbnail_url: string
      cafe_name: string
      distance_km: number
      views: number
      likes: number
      creator: { username: string, profile_picture_url: string }
    }
  ]
  total: number
  page: number
  pages: number
}
```

### GET /api/ugc/videos/trending
Get trending videos by location/category
```typescript
Query Parameters:
- city: string (required)
- mealType?: string
- period?: "today" | "week" | "month" (default: "week")

Response:
{
  success: boolean
  trending: [
    {
      id: string
      title: string
      cafe_name: string
      views: number
      engagement_score: number
      rank: number
    }
  ]
}
```

### GET /api/ugc/videos/near-me
Get videos near user's current location
```typescript
Query Parameters:
- latitude: number (required)
- longitude: number (required)
- radius: number (km, default: 5)
- limit: number (default: 20)
- mealType?: string (optional filter)

Response:
{
  success: boolean
  videos: [
    {
      id: string
      title: string
      cafe_name: string
      distance_km: number
      thumbnail_url: string
      creator: { username: string }
    }
  ]
}
```

---

## Engagement Features

### POST /api/ugc/videos/:videoId/like
Like a video
```typescript
Response: 
{
  success: boolean
  likes_count: number
  is_liked: boolean
}
```

### DELETE /api/ugc/videos/:videoId/like
Unlike a video
```typescript
Response: 
{
  success: boolean
  likes_count: number
  is_liked: boolean
}
```

### GET /api/ugc/videos/:videoId/like
Check if current user liked video
```typescript
Response: 
{
  success: boolean
  is_liked: boolean
}
```

### POST /api/ugc/videos/:videoId/save
Save video to favorites
```typescript
Response: 
{
  success: boolean
  is_saved: boolean
}
```

### DELETE /api/ugc/videos/:videoId/save
Remove from favorites
```typescript
Response: 
{
  success: boolean
  is_saved: boolean
}
```

### GET /api/ugc/videos/:videoId/comments
Get video comments
```typescript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)

Response:
{
  success: boolean
  comments: [
    {
      id: string
      creator: { username: string, profile_picture_url: string }
      comment_text: string
      likes_count: number
      created_at: string
    }
  ]
  total: number
}
```

### POST /api/ugc/videos/:videoId/comments
Post a comment
```typescript
Request:
{
  comment_text: string (required, max 500 chars)
}

Response:
{
  success: boolean
  comment: {
    id: string
    comment_text: string
    created_at: string
  }
}
```

### DELETE /api/ugc/videos/:videoId/comments/:commentId
Delete comment (creator only)
```typescript
Response: { success: boolean, message: string }
```

---

## Creator Profiles

### GET /api/ugc/creators/:creatorId
Get creator profile
```typescript
Response:
{
  id: string
  username: string
  bio: string
  profile_picture_url: string
  follower_count: number
  following_count: number
  total_videos: number
  total_views: number
  is_verified: boolean
  joined_at: string
  videos_count: number
  is_following: boolean (if authenticated)
}
```

### PATCH /api/ugc/creators/:creatorId
Update creator profile (own profile only)
```typescript
Request:
{
  bio?: string
  profile_picture_url?: string
  username?: string
}

Response: { success: boolean, creator: CreatorProfile }
```

### GET /api/ugc/creators/:creatorId/videos
Get creator's videos
```typescript
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- sortBy: "recent" | "popular" (default: "recent")

Response:
{
  success: boolean
  videos: Video[]
  total: number
}
```

### POST /api/ugc/creators/:creatorId/follow
Follow a creator
```typescript
Response:
{
  success: boolean
  follower_count: number
  is_following: boolean
}
```

### DELETE /api/ugc/creators/:creatorId/follow
Unfollow a creator
```typescript
Response:
{
  success: boolean
  follower_count: number
  is_following: boolean
}
```

### GET /api/ugc/creators/:creatorId/analytics
Get creator analytics (own profile only)
```typescript
Query Parameters:
- period?: "week" | "month" | "year" (default: "month")

Response:
{
  total_videos: number
  total_views: number
  total_likes: number
  total_comments: number
  followers_count: number
  engagement_rate: number (percentage)
  average_video_views: number
  top_meal_type: string
  top_location: string
  videos: [
    {
      title: string
      views: number
      likes: number
      engagement_rate: number
    }
  ]
}
```

---

## Content Moderation (Admin)

### GET /api/ugc/admin/moderation/queue
Get videos pending moderation
```typescript
Query Parameters:
- status: "pending" | "approved" | "rejected" (default: "pending")
- limit: number (default: 20)

Response:
{
  queue: [
    {
      video_id: string
      title: string
      cafe_name: string
      creator: { username: string }
      reason_flagged: string
      ai_score: number
      created_at: string
    }
  ]
  count: number
}
```

### POST /api/ugc/admin/moderation/:videoId/approve
Approve flagged video
```typescript
Request:
{
  notes?: string
}

Response: { success: boolean, message: string }
```

### POST /api/ugc/admin/moderation/:videoId/reject
Reject video
```typescript
Request:
{
  reason: string
}

Response: { success: boolean, message: string }
```

---

## Implementation Checklist

### Phase 4 - Video Upload & Search (Weeks 1-2)
- [ ] POST /api/ugc/videos/upload
- [ ] GET /api/ugc/videos/:id
- [ ] DELETE /api/ugc/videos/:id
- [ ] GET /api/ugc/videos/search
- [ ] GET /api/ugc/videos/trending
- [ ] GET /api/ugc/videos/near-me

### Phase 5 - Engagement (Weeks 3-4)
- [ ] POST /api/ugc/videos/:id/like
- [ ] DELETE /api/ugc/videos/:id/like
- [ ] POST /api/ugc/videos/:id/save
- [ ] GET/POST /api/ugc/videos/:id/comments
- [ ] POST /api/ugc/creators/:id/follow

### Phase 6 - Creator Features (Weeks 5-6)
- [ ] GET /api/ugc/creators/:id
- [ ] PATCH /api/ugc/creators/:id
- [ ] GET /api/ugc/creators/:id/videos
- [ ] GET /api/ugc/creators/:id/analytics

### Phase 7 - Moderation (Weeks 7-8)
- [ ] GET /api/ugc/admin/moderation/queue
- [ ] POST /api/ugc/admin/moderation/:id/approve
- [ ] POST /api/ugc/admin/moderation/:id/reject
