"""Concurrent execution utilities for API calls"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any, Callable, TypeVar
import logging

logger = logging.getLogger(__name__)

T = TypeVar('T')


def fetch_concurrent(
    fetch_func: Callable[[str], T],
    identifiers: List[str],
    max_workers: int = 5,
    timeout: float = 120.0
) -> Dict[str, T]:
    """
    Execute fetch function concurrently for multiple identifiers.

    Args:
        fetch_func: Function that takes an identifier and returns a result
        identifiers: List of identifiers to process
        max_workers: Maximum concurrent threads
        timeout: Total timeout for all operations

    Returns:
        Dict mapping identifier -> result (only successful fetches)
    """
    results = {}

    if not identifiers:
        return results

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_id = {
            executor.submit(fetch_func, identifier): identifier
            for identifier in identifiers
        }

        for future in as_completed(future_to_id, timeout=timeout):
            identifier = future_to_id[future]
            try:
                result = future.result()
                if result is not None:
                    results[identifier] = result
            except Exception as e:
                logger.warning(f"Failed to fetch {identifier}: {e}")

    return results
