"""Rate limiting utilities for API calls"""

import time
import asyncio
from typing import Optional
from threading import Lock


class RateLimiter:
    """Token bucket rate limiter for API calls"""

    def __init__(self, rate: float):
        """
        Initialize rate limiter.

        Args:
            rate: Maximum requests per second
        """
        self.rate = rate
        self.interval = 1.0 / rate if rate > 0 else 0
        self.last_call = 0.0
        self.lock = Lock()

    def wait(self) -> None:
        """Block until rate limit allows next call"""
        if self.rate <= 0:
            return

        with self.lock:
            now = time.time()
            time_since_last = now - self.last_call
            if time_since_last < self.interval:
                sleep_time = self.interval - time_since_last
                time.sleep(sleep_time)
            self.last_call = time.time()

    async def wait_async(self) -> None:
        """Async version of wait()"""
        if self.rate <= 0:
            return

        # For async, we use a simpler approach without lock
        # In production, consider using aio-compatible rate limiter
        now = time.time()
        time_since_last = now - self.last_call
        if time_since_last < self.interval:
            sleep_time = self.interval - time_since_last
            await asyncio.sleep(sleep_time)
        self.last_call = time.time()
