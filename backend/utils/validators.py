import ipaddress
import socket
from urllib.parse import urlparse
from typing import Tuple

BLOCKED_HOSTNAMES = {
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "metadata.google.internal",
    "instance-data",
}

def is_private_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_multicast
            or ip.is_reserved
        )
    except ValueError:
        return False

def validate_project_url(raw_url: str) -> Tuple[bool, str, str]:
    """
    Validates a submitted web project URL.
    Returns (is_valid: bool, normalized_url: str, error_message: str).
    """
    if not raw_url or not isinstance(raw_url, str):
        return False, "", "Please enter a valid website URL."

    cleaned = raw_url.strip()
    if not cleaned:
        return False, "", "Please enter a valid website URL."

    # Prepend https:// if user omitted scheme
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned

    try:
        parsed = urlparse(cleaned)
    except Exception:
        return False, "", "That doesn't look like a valid project URL."

    if parsed.scheme not in ("http", "https"):
        return False, "", "Only HTTP and HTTPS project URLs are supported."

    hostname = parsed.hostname
    if not hostname:
        return False, "", "Please provide a valid domain name (e.g., https://myproject.com)."

    hostname_lower = hostname.lower()

    if hostname_lower in BLOCKED_HOSTNAMES:
        return False, "", "Internal or loopback addresses cannot be analyzed for security reasons."

    # Check for direct IP input
    try:
        if is_private_ip(hostname_lower):
            return False, "", "Private network addresses cannot be analyzed."
    except Exception:
        pass

    # Check DNS resolution to catch private network domains and non-existent domains
    try:
        resolved_ips = socket.getaddrinfo(hostname_lower, None)
        for entry in resolved_ips:
            sockaddr = entry[4]
            ip = sockaddr[0]
            if is_private_ip(ip):
                return False, "", "This domain resolves to a private or restricted local address."
    except socket.gaierror:
        return False, "", "We couldn't reach this website. Please check that the domain exists and is online."
    except Exception as e:
        return False, "", f"Could not verify website connection: {str(e)}"

    return True, cleaned, ""
