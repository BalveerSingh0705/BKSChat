import json
import os
# import fitz
# import docx
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
from Services.LocationService import LocationService
from Services.WeatherService import WeatherService
from messages import MESSAGES
import logging


class ChatService:
    def __init__(self):
        config = self._load_config()
        self.model = config.get("model", "default-model")
        self.api_key = config.get("api_key", "")
        self.Websites_Name = config.get("Websites_Name", "DuckDuckGo")

        # Initialize Gemini model
        genai.configure(api_key=self.api_key)
        self.gemini_model = genai.GenerativeModel(model_name=self.model)
        self.chat_session = self.gemini_model.start_chat()

        # Initialize external services
        self.location_service = LocationService()
        self.weather_service = WeatherService()

    def _load_config(self):
        config_path = os.path.join(os.path.dirname(__file__), "Config", "config.json")
        try:
            with open(config_path, "r") as file:
                return json.load(file)
        except Exception as e:
            print(f"[ERROR] Failed to load config: {e}")
            return {}

    def generate_response(self, prompt: str):
        if not prompt or not isinstance(prompt, str):
            yield MESSAGES["invalid_prompt"]
            return

        try:
            if self._is_weather_query(prompt):
                # Handle weather-related queries
                yield from self._handle_weather_query()

            elif self._needs_live_data(prompt):
                # Handle queries that require live data
                google_data = self._fetch_from_WebSites(prompt)
                print(f"🔎 Live data from Google:\n{google_data}")
                yield f"\n🔎 Live data from Google:\n{google_data}"

            else:       
                model_response = self._get_model_response(prompt)
                if self.is_knowledge_limitation_response(model_response):
                    model_response = ' '
                    google_data = self._fetch_from_WebSites(prompt)
                    yield f"\n🔎 Live data from Google:\n{google_data}"

                else:
                    yield model_response
            
                # Check if the model's response indicates a knowledge limitation
                

        except Exception as e:
            yield MESSAGES["gemini_api_error"].format(error=str(e))

    def _get_model_response(self, prompt: str) -> str:
        try:
            response = self.chat_session.send_message(prompt)
            return response.text if hasattr(response, 'text') else MESSAGES["no_model_response"]
        except Exception as e:
            print(f"[ERROR] Model response failed: {e}")
            return MESSAGES["gemini_api_error"].format(error=str(e))

    def _handle_weather_query(self):
        location = self.location_service.get_user_location()
        if "error" in location:
            yield MESSAGES["location_error"].format(error=location["error"])
            return

        city = location["city"]
        timezone = location["timezone"]
        local_time = self.location_service.get_local_time(timezone)
        weather = self.weather_service.get_weather(city)

        if "error" in weather:
            yield MESSAGES["weather_error"].format(error=weather["error"])
            return

        yield (
            f"📍 Location: {city}, {location['region']}, {location['country']}\n"
            f"🕒 Local Time: {local_time}\n"
            f"🌡️ Temperature: {weather['temperature']}°C\n"
            f"🌤️ Weather: {weather['description']}\n"
            f"💧 Humidity: {weather['humidity']}%\n"
            f"💨 Wind Speed: {weather['wind_speed']} km/h"
        )

    def _is_weather_query(self, prompt: str) -> bool:
        try:
            keywords_path = os.path.join(os.path.dirname(__file__), "Services", "weather_keywords.json")
            with open(keywords_path, "r") as file:
                keywords = json.load(file).get("weather_keywords", [])
            return any(keyword in prompt.lower() for keyword in keywords)
        except Exception as e:
            print(f"[ERROR] Reading weather keywords: {e}")
            return False
    # def _fetch_from_WebSites(self, query: str) -> str:
    #     try:
      

    #         params = {
    #             "q": query,
    #             "api_key": "96fe527914e445b8dd0df2bc3625b19cc665d8f5ec1d8e67c211e816485e6d7e",  # Replace this with your real key
    #             "engine": "google",
    #         }

    #         response = requests.get("https://serpapi.com/search", params=params)
    #         data = response.json()
           
    #         # Try to extract from answer box or top organic result
    #         if "answer_box" in data:
    #             return data["answer_box"].get("answer") or data["answer_box"].get("snippet", "No direct answer found.")
    #         elif "organic_results" in data and data["organic_results"]:
    #             return data["organic_results"][0].get("snippet", "No snippet found.")
    #         else:
    #             return "⚠️ No useful result found from Google (via SerpAPI)."

    #     except Exception as e:
    #         return f"⚠️ Failed to retrieve live data: {e}"

    def _fetch_from_WebSites(self, query: str) -> str:
        """
        Fetches live data from Brave Search for the given query.
        Returns the most relevant text snippet or error message.
        """
        try:
            print("🔎 Searching Brave Search...")
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
                "Accept-Language": "en-US,en;q=0.9"
            }
            params = {
                "q": query,
                "source": "web"
            }
            
            response = requests.get(
                self.Websites_Name,
                headers=headers,
                params=params,
                timeout=1000
            )
            response.raise_for_status()  # Raises HTTPError for bad responses

            soup = BeautifulSoup(response.text, "html.parser")
            
            # Brave Search result selectors (updated as of 2024)
            main_result = soup.select_one(".snippet.fdb")  # Featured snippet
            if main_result:
                return main_result.get_text(strip=True, separator=" ")
                
            organic_results = soup.select(".snippet-content:not(.video):not(.news)")  # Standard results
            if organic_results:
                return organic_results[0].get_text(strip=True, separator=" ")
                
            # Fallback to meta description if no snippets found
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc:
                return meta_desc["content"]
                
            return "⚠️ No useful result found on Brave Search."

        except requests.exceptions.RequestException as e:
            return f"⚠️ Network error: {str(e)}"
        except Exception as e:
            return f"⚠️ Unexpected error: {str(e)}"
    def _needs_live_data(self , response_or_prompt: str) -> bool:
            
            keywords = [
                "real-time", "current", "latest", "live",
                "today", "now", "new", "trending", "recent",
                "score", "weather", "forecast", "price", "news",
                "cutoff", "as an ai", "don't have access", "not connected",
                "check an official source"
            ]
            return any(keyword in response_or_prompt.lower() for keyword in keywords)


    def is_knowledge_limitation_response(self, response: str) -> bool:
        """
        Checks if the response contains phrases indicating a knowledge limitation.
        """
   
        limitation_phrases = [
            # General knowledge limitations
            "as an ai language model, i don’t have access to real-time data",
            "i do not have access to real-time information",
            "I do not have access to a continuously updated news feed",
            "my training data only goes up until",
            "my knowledge cutoff is",
            "i can’t provide current information on",
            "i don’t have access to the internet to look that up",
            "this information might be outdated",
            "i’m not connected to the internet",

            # News or event-specific limitations
            "i can’t provide the latest news",
            "please check a reliable source for the most current information",
            "you should verify with an up-to-date source",

            # Live stats / Sports / Market data
            "i cannot give live scores or results",
            "i don't have live stock market data",
            "check an official website for current stats",
            "scheduled for today",
        ]

        normalized_response = response.lower()
        return any(phrase in normalized_response for phrase in limitation_phrases)


# class FileService:
#     def extract_text_from_file(self, file_path: str) -> str:
#         ext = os.path.splitext(file_path)[-1].lower()
#         if ext == ".pdf":
#             return self._extract_pdf(file_path)
#         elif ext in [".docx", ".doc"]:
#             return self._extract_docx(file_path)
#         else:
#             raise ValueError(MESSAGES["unsupported_file_type"])

#     def _extract_pdf(self, path: str) -> str:
#         try:
#             print(MESSAGES["extracting_pdf"])
#             doc = fitz.open(path)
#             return "\n".join(page.get_text() for page in doc)
#         except Exception as e:
#             raise ValueError(MESSAGES["pdf_processing_error"].format(error=str(e)))

#     def _extract_docx(self, path: str) -> str:
#         try:
#             print(MESSAGES["extracting_docx"])
#             doc = docx.Document(path)
#             return "\n".join(para.text for para in doc.paragraphs if para.text.strip())
#         except Exception as e:
#             raise ValueError(MESSAGES["docx_processing_error"].format(error=str(e)))
