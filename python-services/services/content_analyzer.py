import httpx
import asyncio
from typing import Dict, List, Any, Optional
from groq import Groq
from PIL import Image
from io import BytesIO
import logging
import base64

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    """Analyze reel content for food relevance, meal type, and quality"""
    
    def __init__(self, groq_api_key: str):
        self.client = Groq(api_key=groq_api_key)
        self.meal_types = ['breakfast', 'brunch', 'lunch', 'dinner', 'dessert', 'cafe', 'snacks']
    
    async def fetch_thumbnail(self, url: str) -> Optional[bytes]:
        """Fetch reel thumbnail image"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url, timeout=10.0)
                if response.status_code == 200:
                    return response.content
        except Exception as e:
            logger.error(f"Failed to fetch thumbnail from {url}: {e}")
        return None
    
    def image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string"""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    async def analyze_reel(
        self,
        caption: str,
        hashtags: List[str],
        thumbnail_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze reel for food relevance and metadata
        
        Returns:
            {
                'is_food_related': bool,
                'confidence': float (0-1),
                'meal_types': List[str],
                'quality_score': float (0-100),
                'detected_cuisines': List[str],
                'summary': str
            }
        """
        try:
            # Build analysis prompt
            analysis_prompt = f"""Analyze this food/restaurant reel for:
1. Is it genuinely about food or a restaurant? (yes/no)
2. What meal types does it relate to? (breakfast, brunch, lunch, dinner, dessert, cafe, snacks)
3. Quality score (0-100) based on content appeal
4. Detected cuisines if any

Caption: {caption}
Hashtags: {', '.join(hashtags)}

Respond in JSON format:
{{
    "is_food_related": boolean,
    "confidence": number (0-1),
    "meal_types": [list of detected meal types],
    "quality_score": number (0-100),
    "detected_cuisines": [list of cuisines],
    "summary": "brief summary"
}}"""
            
            # Call Groq API
            message = self.client.messages.create(
                model="mixtral-8x7b-32768",
                max_tokens=500,
                messages=[
                    {
                        "role": "user",
                        "content": analysis_prompt
                    }
                ]
            )
            
            # Parse response
            response_text = message.content[0].text
            
            # Extract JSON from response
            import json
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            result = json.loads(json_str)
            
            return result
            
        except Exception as e:
            logger.error(f"Content analysis failed: {e}")
            return {
                'is_food_related': False,
                'confidence': 0.0,
                'meal_types': [],
                'quality_score': 0,
                'detected_cuisines': [],
                'summary': 'Analysis failed',
                'error': str(e)
            }
    
    async def batch_analyze(
        self,
        reels: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Analyze multiple reels concurrently"""
        tasks = [
            self.analyze_reel(
                caption=reel.get('caption', ''),
                hashtags=reel.get('hashtags', []),
                thumbnail_url=reel.get('thumbnail_url')
            )
            for reel in reels
        ]
        return await asyncio.gather(*tasks)
    
    def score_reel(self, analysis: Dict[str, Any]) -> float:
        """
        Calculate overall reel score (0-100) based on analysis
        Considers: food relevance, quality, meal type specificity
        """
        if not analysis.get('is_food_related'):
            return 0.0
        
        confidence = analysis.get('confidence', 0) * 100
        quality = analysis.get('quality_score', 0)
        meal_types_count = len(analysis.get('meal_types', [])) * 10
        
        # Weighted average
        score = (confidence * 0.4) + (quality * 0.4) + min(meal_types_count, 30) * 0.2
        return min(score, 100)
