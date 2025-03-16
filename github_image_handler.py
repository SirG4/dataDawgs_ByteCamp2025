import requests
from PIL import Image
from io import BytesIO
import json

BASE_URL = "https://api.github.com/repos/SirG4/car_images_bytecamp/contents/"
RAW_BASE_URL = "https://raw.githubusercontent.com/SirG4/car_images_bytecamp/main/"

def get_latest_github_image():
    """Get the most recently added image from GitHub repo"""
    try:
        # Get repository contents
        response = requests.get(BASE_URL)
        response.raise_for_status()
        contents = response.json()
        
        # Filter for image files and sort by name (assuming names contain timestamps)
        images = [item['name'] for item in contents if item['name'].lower().endswith(('.png', '.jpg', '.jpeg'))]
        if not images:
            return None
            
        # Return most recent image name
        return sorted(images)[-1]
    except Exception as e:
        print(f"Error getting latest GitHub image: {e}")
        return None

def download_github_image(image_path):
    """Download image from GitHub repository"""
    try:
        url = RAW_BASE_URL + image_path
        response = requests.get(url)
        response.raise_for_status()
        return Image.open(BytesIO(response.content))
    except Exception as e:
        print(f"Error downloading image from GitHub: {e}")
        return None

def is_valid_image_path(image_path):
    """Check if image exists in the GitHub repository"""
    url = RAW_BASE_URL + image_path
    response = requests.head(url)
    return response.status_code == 200
