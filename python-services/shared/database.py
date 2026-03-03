import asyncpg
import asyncio
from typing import Optional, List, Dict, Any
from shared.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    """Async PostgreSQL database connection manager"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
    
    async def connect(self):
        """Create database connection pool"""
        try:
            self.pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=5,
                max_size=20,
            )
            logger.info("Database connection pool created successfully")
        except Exception as e:
            logger.error(f"Failed to create database pool: {e}")
            raise
    
    async def disconnect(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
    
    async def execute(self, query: str, *args) -> Any:
        """Execute a query and return results"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        
        async with self.pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def execute_one(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """Execute a query and return single row"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
    
    async def insert(self, query: str, *args) -> Optional[Dict[str, Any]]:
        """Insert and return the created record"""
        if not self.pool:
            raise RuntimeError("Database not connected")
        
        async with self.pool.acquire() as connection:
            return await connection.fetchrow(query, *args)

# Global database instance
db = Database()
