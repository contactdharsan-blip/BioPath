"""Caching service for API responses"""

import json
import hashlib
from typing import Any, Optional
from diskcache import Cache
import logging

from app.config import settings

logger = logging.getLogger(__name__)


class CacheService:
    """Disk-based caching service with TTL support"""

    def __init__(self):
        self.cache = Cache(settings.disk_cache_dir)
        self.ttl = settings.cache_ttl

    def _generate_key(self, prefix: str, identifier: str) -> str:
        """Generate cache key from prefix and identifier"""
        # Use hash for long identifiers
        if len(identifier) > 100:
            identifier = hashlib.md5(identifier.encode()).hexdigest()
        return f"{prefix}:{identifier}"

    def get(self, prefix: str, identifier: str) -> Optional[Any]:
        """
        Retrieve cached value.

        Args:
            prefix: Cache namespace (e.g., "pubchem", "chembl")
            identifier: Unique identifier (e.g., InChIKey, CID)

        Returns:
            Cached value or None if not found/expired
        """
        key = self._generate_key(prefix, identifier)
        try:
            value = self.cache.get(key)
            if value is not None:
                logger.debug(f"Cache HIT: {key}")
                return value
            logger.debug(f"Cache MISS: {key}")
            return None
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None

    def set(self, prefix: str, identifier: str, value: Any, ttl: Optional[int] = None) -> bool:
        """
        Store value in cache.

        Args:
            prefix: Cache namespace
            identifier: Unique identifier
            value: Value to cache (must be JSON-serializable)
            ttl: Time-to-live in seconds (default: from settings)

        Returns:
            True if successful
        """
        key = self._generate_key(prefix, identifier)
        expire_time = ttl if ttl is not None else self.ttl

        try:
            self.cache.set(key, value, expire=expire_time)
            logger.debug(f"Cache SET: {key} (TTL: {expire_time}s)")
            return True
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False

    def delete(self, prefix: str, identifier: str) -> bool:
        """Delete cached value"""
        key = self._generate_key(prefix, identifier)
        try:
            return self.cache.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False

    def clear_all(self) -> None:
        """Clear entire cache"""
        try:
            self.cache.clear()
            logger.info("Cache cleared")
        except Exception as e:
            logger.error(f"Cache clear error: {e}")


# Global cache instance
cache_service = CacheService()
