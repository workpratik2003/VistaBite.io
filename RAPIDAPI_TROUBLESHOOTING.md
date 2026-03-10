# RapidAPI Instagram Integration - Troubleshooting Guide

## **Problem: "Using Demo Mode" - RapidAPI Not Working**

This guide helps you fix the RapidAPI Instagram scraper integration.

---

## **Step 1: Test Your API Key**

Visit this URL in your browser to test if your RapidAPI key works:

```
https://yourapp.vercel.app/api/test-rapidapi
```

This will test all 3 popular Instagram APIs and show which ones work with your key.

---

## **Step 2: Identify Which API You Have**

Go to your RapidAPI dashboard and check which Instagram API you subscribed to:

### **Option A: Instagram Scraper API 2** (Most Common)
- **Host**: `instagram-scraper-api2.p.rapidapi.com`
- **Endpoint**: `/v1/hashtag?hashtag={hashtag}`
- **Status**: ✅ Already configured in the code

### **Option B: Instagram API (instagram47)**
- **Host**: `instagram47.p.rapidapi.com`
- **Endpoint**: `/instagram_search_hashtag?ig_hashtag={hashtag}`
- **Status**: ❌ Need to update config

### **Option C: Instagram Bulk Profile Scraper**
- **Host**: `instagram-bulk-profile-scrapper.p.rapidapi.com`
- **Endpoint**: `/search/hashtag?hashtag={hashtag}`
- **Status**: ❌ Need to update config

---

## **Step 3: Update Configuration**

If you have a different API, update `/lib/instagram-api.ts`:

### **For Instagram API (instagram47):**

Replace this section (lines 37-45):

```typescript
const response = await fetch(
  `https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=${encodeURIComponent(hashtag)}`,
  {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'instagram-scraper-api2.p.rapidapi.com',
    },
  }
)
```

With this:

```typescript
const response = await fetch(
  `https://instagram47.p.rapidapi.com/instagram_search_hashtag?ig_hashtag=${encodeURIComponent(hashtag)}`,
  {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'instagram47.p.rapidapi.com',
    },
  }
)
```

### **For Instagram Bulk Profile Scraper:**

Replace with:

```typescript
const response = await fetch(
  `https://instagram-bulk-profile-scrapper.p.rapidapi.com/search/hashtag?hashtag=${encodeURIComponent(hashtag)}`,
  {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'instagram-bulk-profile-scrapper.p.rapidapi.com',
    },
  }
)
```

---

## **Step 4: Check Response Format**

Each API returns data in different formats. Update lines 60-63 to match your API:

### **Instagram Scraper API 2 Format:**
```typescript
const reels = data.data?.items || []
```

### **Instagram API (instagram47) Format:**
```typescript
const reels = data.data || []
```

### **Instagram Bulk Profile Scraper Format:**
```typescript
const reels = data.hashtags?.[0]?.posts || []
```

---

## **Step 5: Common Issues**

### **Issue: 401 Unauthorized**
- ❌ RapidAPI key is invalid or expired
- ✅ **Fix**: Regenerate key from RapidAPI dashboard
- ✅ **Fix**: Verify key is added to environment variables

### **Issue: 403 Forbidden**
- ❌ API key doesn't have access to this endpoint
- ✅ **Fix**: Check you're subscribed to the correct API
- ✅ **Fix**: Verify subscription tier includes this endpoint

### **Issue: 429 Too Many Requests**
- ❌ You've exceeded rate limits
- ✅ **Fix**: Wait before making more requests
- ✅ **Fix**: Upgrade RapidAPI subscription tier

### **Issue: 500 Server Error**
- ❌ The RapidAPI service is having issues
- ✅ **Fix**: Wait 5-10 minutes and try again
- ✅ **Fix**: Check RapidAPI status page: status.rapidapi.com

---

## **Step 6: Verify It Works**

1. Go to search page in Vistabite
2. Type "breakfast cafe"
3. Click Search
4. You should see real Instagram reels instead of "Demo Mode"

---

## **If Still Not Working:**

1. **Check API is active**: Go to RapidAPI dashboard → Subscriptions → Make sure API shows "Active"
2. **Check quota**: Verify you haven't exceeded monthly API calls
3. **Test with curl**: 
```bash
curl -X GET "https://instagram-scraper-api2.p.rapidapi.com/v1/hashtag?hashtag=food" \
  -H "X-RapidAPI-Key: YOUR_KEY" \
  -H "X-RapidAPI-Host: instagram-scraper-api2.p.rapidapi.com"
```

4. **Check environment variable**: In v0 Vars, verify RAPIDAPI_KEY is set correctly (no extra spaces)

---

## **Alternative: Use Demo Mode Permanently**

If RapidAPI doesn't work, the app will automatically use intelligent mock data. This is actually a good solution because:
- ✅ No API costs
- ✅ Reliable (never goes down)
- ✅ You can manually add reels via the submit form instead

---

**Need help? Check the test endpoint output and share which APIs returned 200 status code.**
