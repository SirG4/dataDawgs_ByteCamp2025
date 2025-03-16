import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime

# Initialize Firebase with the service account
cred = credentials.Certificate("ss-park-2a878-firebase-adminsdk-fbsvc-ff5268625e.json")
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

def save_car_image_data(image_path, license_plate, timestamp=None):
    """Save car image data to Firestore"""
    if timestamp is None:
        timestamp = datetime.now()
    
    car_doc = db.collection('car_images').document()
    car_doc.set({
        'image_path': image_path,
        'license_plate': license_plate,
        'timestamp': timestamp,
        'processed': True
    })
    return car_doc.id

def get_car_images():
    """Retrieve all car images from Firestore"""
    cars_ref = db.collection('car_images')
    docs = cars_ref.stream()
    return {doc.id: doc.to_dict() for doc in docs}

def check_image_processed(image_path):
    """Check if an image has already been processed"""
    cars_ref = db.collection('car_images')
    query = cars_ref.where('image_path', '==', image_path).limit(1)
    existing = list(query.stream())
    return len(existing) > 0
