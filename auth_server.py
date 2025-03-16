from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
CORS(app)

CSV_FILE = 'users.csv'

# Initialize CSV if it doesn't exist
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['email', 'password', 'vehicle_number'])

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    vehicle_number = data.get('vehicleNumber')

    # Check if user exists
    with open(CSV_FILE, 'r') as f:
        reader = csv.DictReader(f)
        if any(row['email'] == email for row in reader):
            return jsonify({'status': 'error', 'message': 'User already exists'}), 400

    # Add new user
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([email, password, vehicle_number])

    return jsonify({'status': 'success', 'message': 'User registered successfully'})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    with open(CSV_FILE, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['email'] == email and row['password'] == password:
                return jsonify({
                    'status': 'success',
                    'message': 'Login successful',
                    'user': {
                        'email': email,
                        'vehicleNumber': row['vehicle_number']
                    }
                })

    return jsonify({'status': 'error', 'message': 'Invalid credentials'}), 401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
