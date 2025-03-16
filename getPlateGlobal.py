import google.generativeai as genai
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Gemini API
GOOGLE_API_KEY = "AIzaSyAMaPTyCmZX6W5-mYXjrKz38YN9islbtwM"
genai.configure(api_key=GOOGLE_API_KEY)

def send_to_gemini_api(image):
    """Send image to Gemini API for plate recognition"""
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([
            "Return ONLY the license plate number visible in this image. No additional text, no prefix, no explanation - just the alphanumeric characters of the plate.",
            image
        ])
        return response.text.strip()
    except Exception as e:
        logger.error(f"Error in API call: {e}")
        return None
