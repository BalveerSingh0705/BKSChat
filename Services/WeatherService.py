import requests
import pytz
from datetime import datetime


class WeatherService:
    """Handles weather-related operations."""

    @staticmethod
    def get_weather(city):
        """Fetch weather data for a given city."""
        url = f"https://wttr.in/{city}?format=j1"
        try:
            response = requests.get(url)
            data = response.json()
            current = data['current_condition'][0]
            return {
                "temperature": current['temp_C'],
                "description": current['weatherDesc'][0]['value'],
                "humidity": current['humidity'],
                "wind_speed": current['windspeedKmph']
            }
        except Exception as e:
            return {"error": str(e)}