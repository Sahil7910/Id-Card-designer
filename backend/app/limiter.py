from slowapi import Limiter


def _get_real_ip(request) -> str:  # type: ignore[type-arg]
    """Return the real client IP, preferring the X-Real-IP header set by Nginx."""
    return request.headers.get("X-Real-IP") or request.client.host


limiter = Limiter(key_func=_get_real_ip)
