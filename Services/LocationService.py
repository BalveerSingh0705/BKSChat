import requests
import pytz
from datetime import datetime


class LocationService:
    """Handles location-related operations."""

    @staticmethod
    def get_user_location():
        """Fetch user location using IP-based geolocation."""
        try:
            ip_info = requests.get("https://ipinfo.io/json").json()
            city = ip_info.get("city", "Unknown")
            region = ip_info.get("region", "Unknown")
            country = ip_info.get("country", "Unknown")
            timezone = ip_info.get("timezone", "UTC")
            return {
                "city": city,
                "region": region,
                "country": country,
                "timezone": timezone
            }
        except Exception as e:
            return {"error": f"Failed to get location: {str(e)}"}

    @staticmethod
    def get_local_time(timezone):
        """Get the local time for a given timezone."""
        try:
            tz = pytz.timezone(timezone)
            return datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
        except Exception as e:
            return f"Error: {str(e)}"