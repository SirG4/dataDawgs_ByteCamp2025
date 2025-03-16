import time
import logging
from github_image_handler import get_latest_github_image, download_github_image
from getPlateGlobal import send_to_gemini_api
from database import save_car_image_data, check_image_processed
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def process_new_image(image_path):
    """Process a single image and store results"""
    try:
        print(f"\n[PROCESSING] Starting to process image: {image_path}")
        
        # Download image from GitHub
        print("[DOWNLOAD] Downloading image from GitHub...")
        image = download_github_image(image_path)
        if not image:
            print("[ERROR] ❌ Failed to download image")
            return False
        print("[DOWNLOAD] ✅ Image downloaded successfully")
            
        # Get plate number from image
        print("[AI] Sending image to Gemini API for plate recognition...")
        plate_number = send_to_gemini_api(image)
        if not plate_number:
            print("[ERROR] ❌ Failed to recognize license plate")
            return False
        print(f"[AI] ✅ License plate recognized: {plate_number}")
            
        # Store in database
        print("[DATABASE] Saving results to Firebase...")
        save_car_image_data(image_path, plate_number, datetime.now())
        print(f"[SUCCESS] ✅ Image processed successfully\n" + 
              f"          📸 Image: {image_path}\n" +
              f"          🚗 Plate: {plate_number}\n")
        return True
        
    except Exception as e:
        print(f"[ERROR] ❌ Error processing image: {str(e)}")
        return False

def run_server():
    """Main server loop"""
    print("\n" + "="*50)
    print("🚀 Starting License Plate Recognition Server")
    print("="*50 + "\n")
    print("Press Ctrl+C to stop the server\n")
    
    processed_images = set()
    check_count = 0
    
    while True:
        try:
            check_count += 1
            current_time = datetime.now().strftime("%H:%M:%S")
            print(f"\r[CHECK #{check_count}] {current_time} Checking for new images...", end="", flush=True)
            
            # Check for new image
            latest_image = get_latest_github_image()
            
            if latest_image:
                if latest_image not in processed_images:
                    print(f"\n[NEW IMAGE] 🆕 Found new image: {latest_image}")
                    if process_new_image(latest_image):
                        processed_images.add(latest_image)
                else:
                    print(f"\r[SKIP] Image already processed: {latest_image}", end="", flush=True)
            
            time.sleep(10)
            
        except KeyboardInterrupt:
            print("\n\n" + "="*50)
            print("👋 Server shutdown requested")
            print(f"✅ Processed {len(processed_images)} images")
            print("="*50 + "\n")
            break
            
        except Exception as e:
            print(f"\n[ERROR] ⚠️ Server error: {str(e)}")
            print("Retrying in 10 seconds...")
            time.sleep(10)

if __name__ == "__main__":
    run_server()
