from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class AnalyticsEngine:
    """Process and generate analytics for reels and restaurants"""
    
    async def get_trending_meals(
        self,
        reels: List[Dict[str, Any]],
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """Get trending meal types based on recent reels"""
        meal_type_counts = Counter()
        
        for reel in reels:
            meal_types = reel.get('meal_types', [])
            for meal_type in meal_types:
                meal_type_counts[meal_type] += 1
        
        trending = [
            {
                'meal_type': meal_type,
                'count': count,
                'percentage': (count / len(reels) * 100) if reels else 0
            }
            for meal_type, count in meal_type_counts.most_common(10)
        ]
        
        return trending
    
    async def get_restaurant_rankings(
        self,
        submissions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Rank restaurants by quality score and engagement"""
        restaurant_stats = {}
        
        for submission in submissions:
            restaurant = submission.get('restaurant_name', 'Unknown')
            quality_score = submission.get('quality_score', 0)
            view_count = int(submission.get('views', '0').replace('K', '000')) if submission.get('views') else 0
            
            if restaurant not in restaurant_stats:
                restaurant_stats[restaurant] = {
                    'restaurant_name': restaurant,
                    'total_reels': 0,
                    'avg_quality_score': 0,
                    'total_views': 0,
                    'ratings': []
                }
            
            stats = restaurant_stats[restaurant]
            stats['total_reels'] += 1
            stats['ratings'].append(quality_score)
            stats['total_views'] += view_count
        
        # Calculate averages and sort
        rankings = []
        for restaurant, stats in restaurant_stats.items():
            stats['avg_quality_score'] = sum(stats['ratings']) / len(stats['ratings']) if stats['ratings'] else 0
            stats.pop('ratings')
            rankings.append(stats)
        
        rankings.sort(key=lambda x: x['avg_quality_score'], reverse=True)
        return rankings[:20]
    
    async def get_location_stats(
        self,
        submissions: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get statistics for each location"""
        location_stats = {}
        
        for submission in submissions:
            city = submission.get('city', 'Unknown')
            
            if city not in location_stats:
                location_stats[city] = {
                    'city': city,
                    'total_reels': 0,
                    'restaurants': set(),
                    'meal_types': [],
                    'avg_quality_score': 0
                }
            
            stats = location_stats[city]
            stats['total_reels'] += 1
            stats['restaurants'].add(submission.get('restaurant_name'))
            stats['meal_types'].extend(submission.get('meal_types', []))
            stats['avg_quality_score'] += submission.get('quality_score', 0)
        
        # Convert to list and calculate final stats
        result = []
        for city, stats in location_stats.items():
            stats['unique_restaurants'] = len(stats['restaurants'])
            stats['popular_meal_types'] = Counter(stats['meal_types']).most_common(3)
            stats['avg_quality_score'] = stats['avg_quality_score'] / stats['total_reels'] if stats['total_reels'] > 0 else 0
            stats.pop('restaurants')
            stats.pop('meal_types')
            result.append(stats)
        
        result.sort(key=lambda x: x['total_reels'], reverse=True)
        return result
    
    async def get_content_insights(
        self,
        submissions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Get overall content performance insights"""
        if not submissions:
            return {
                'total_submissions': 0,
                'approved_submissions': 0,
                'pending_submissions': 0,
                'avg_quality_score': 0,
                'most_common_meal_type': None,
                'top_city': None,
                'engagement_rate': 0
            }
        
        approved = [s for s in submissions if s.get('status') == 'approved']
        pending = [s for s in submissions if s.get('status') == 'pending']
        
        meal_types = []
        cities = []
        quality_scores = []
        total_views = 0
        
        for submission in approved:
            meal_types.extend(submission.get('meal_types', []))
            cities.append(submission.get('city'))
            quality_scores.append(submission.get('quality_score', 0))
            views_str = submission.get('views', '0')
            total_views += int(views_str.replace('K', '000')) if views_str else 0
        
        meal_type_counter = Counter(meal_types)
        city_counter = Counter(cities)
        
        insights = {
            'total_submissions': len(submissions),
            'approved_submissions': len(approved),
            'pending_submissions': len(pending),
            'avg_quality_score': sum(quality_scores) / len(quality_scores) if quality_scores else 0,
            'most_common_meal_type': meal_type_counter.most_common(1)[0][0] if meal_type_counter else None,
            'top_city': city_counter.most_common(1)[0][0] if city_counter else None,
            'total_views': total_views,
            'approval_rate': (len(approved) / len(submissions) * 100) if submissions else 0
        }
        
        return insights

# Global analytics instance
analytics = AnalyticsEngine()
