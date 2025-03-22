from flask import Flask, jsonify, request
from flask_cors import CORS
import subprocess
import platform
import re
import requests
import time
import pyrebase
import threading
from pymongo import MongoClient
import os
import shutil
import psutil

app = Flask(__name__)
CORS(app)

# Firebase configuration
firebase_config = {
    "apiKey": "AIzaSyD0qjnrDLjAs0BGQavFuvV7zQhgJ6ijos0",
    "authDomain": "kiosk-b8f76.firebaseapp.com",
    "databaseURL": "https://kiosk-b8f76-default-rtdb.firebaseio.com",
    "storageBucket": "kiosk-b8f76.firebasestorage.app",
}

# Connect to MongoDB using your provided URI
MONGO_URI = "mongodb+srv://backend:GpwHU0tIVU3Wsi2z@amenconnect.4vekp.mongodb.net/client?retryWrites=true&w=majority"
mongo_client = MongoClient(MONGO_URI)
db = mongo_client.get_database()  # Uses the default database from the URI
kiosks_collection = db.kiosks     # Assumes kiosks are stored in the 'kiosks' collection

def get_serial_number():
    system = platform.system()
    try:
        if system == "Windows":
            output = subprocess.check_output(
                ["wmic", "bios", "get", "serialnumber"], universal_newlines=True
            )
            lines = [line.strip() for line in output.splitlines() if line.strip()]
            serial_lines = [line for line in lines if line.lower() != "serialnumber"]
            serial = serial_lines[0] if serial_lines else "Unknown or not available"
        elif system == "Linux":
            output = subprocess.check_output(
                ["sudo", "dmidecode", "-s", "system-serial-number"], universal_newlines=True
            )
            serial = output.strip()
        elif system == "Darwin":
            output = subprocess.check_output(
                ["system_profiler", "SPHardwareDataType"], universal_newlines=True
            )
            match = re.search(r"Serial Number.*: (.+)", output)
            serial = match.group(1).strip() if match else "Unknown"
        else:
            serial = "Unsupported OS"
    except Exception as e:
        serial = f"Error: {e}"
    return serial

def get_temperature():
    """
    Retrieves a temperature reading from the GPU using nvidia-smi.
    This command queries the GPU temperature in Celsius.
    """
    try:
        output = subprocess.check_output(
            ["nvidia-smi", "--query-gpu=temperature.gpu", "--format=csv,noheader,nounits"],
            universal_newlines=True
        )
        gpu_temp = output.strip()
        if gpu_temp.isdigit():
            return float(gpu_temp)
        else:
            print("nvidia-smi did not return a valid digit:", gpu_temp)
            return None
    except Exception as e:
        print("Error using nvidia-smi for GPU temperature:", e)
        return None

def update_kiosk_status(new_status, additional_fields=None):
    """
    Updates the kiosk document (found by its serial number) in MongoDB.
    """
    serial = get_serial_number()
    update_fields = {"status": new_status}
    if additional_fields:
        update_fields.update(additional_fields)
    result = kiosks_collection.update_one({"SN": serial}, {"$set": update_fields})
    if result.matched_count:
        print(f"Kiosk with serial {serial} updated to {new_status}.")
    else:
        print(f"Kiosk with serial {serial} not found in the database.")

@app.route('/shutdown', methods=['POST'])
def shutdown_api():
    data = request.get_json()
    provided_serial = data.get("serialNumber")
    
    if not provided_serial:
        return jsonify({"error": "Serial number is required."}), 400

    local_serial = get_serial_number()
    if provided_serial != local_serial:
        return jsonify({"error": "Serial number mismatch."}), 403

    firebase = pyrebase.initialize_app(firebase_config)
    db_fb = firebase.database()  # Use this variable for Firebase calls
    
    shutdown_data = {
        "command": "shutdown",
        "timestamp": int(time.time())
    }

    try:
        # Use db_fb instead of db
        db_fb.child("shutdown_commands").child(local_serial).set(shutdown_data)
        exit()  
        print("Shutdown command return code:")
        return jsonify({"message": f"Shutdown command sent to serial {local_serial} via Firebase."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def firebase_command_listener():
    firebase = pyrebase.initialize_app(firebase_config)
    db_fb = firebase.database()
    local_serial = get_serial_number()
    print(f"Firebase command listener started for serial {local_serial}")

    while True:
        try:
            # Check for shutdown command
            shutdown_data = db_fb.child("shutdown_commands").child(local_serial).get().val()
            if shutdown_data and shutdown_data.get("command") == "shutdown":
                command_timestamp = shutdown_data.get("timestamp")
                current_time = time.time()
                # Normalize timestamp if needed (if in milliseconds)
                if command_timestamp and command_timestamp > 1e12:
                    command_timestamp = command_timestamp / 1000
                print(f"Received shutdown command. Timestamp: {command_timestamp}, Current time: {current_time}")
                if command_timestamp and (current_time - command_timestamp) > 20:
                    print("Found an old shutdown command. Removing it.")
                    db_fb.child("shutdown_commands").child(local_serial).remove()
                else:
                    system = platform.system()
                    print(f"Initiating shutdown for {system} based on command.")
                    if system == "Windows":
                        subprocess.run(["shutdown", "/s", "/t", "0"], shell=True)
                    elif system == "Linux":
                        subprocess.run(["sudo", "shutdown", "now"], check=True)
                    elif system == "Darwin":
                        subprocess.run(["sudo", "shutdown", "-h", "now"], check=True)
                    db_fb.child("shutdown_commands").child(local_serial).remove()
                    break  # Optional: break if the system is going down

            # Check for restart command
            restart_data = db_fb.child("restart_commands").child(local_serial).get().val()
            if restart_data and restart_data.get("command") == "restart":
                command_timestamp = restart_data.get("timestamp")
                current_time = time.time()
                if command_timestamp and command_timestamp > 1e12:
                    command_timestamp = command_timestamp / 1000
                print(f"Received restart command. Timestamp: {command_timestamp}, Current time: {current_time}")
                if command_timestamp and (current_time - command_timestamp) > 20:
                    print("Found an old restart command. Removing it.")
                    db_fb.child("restart_commands").child(local_serial).remove()
                else:
                    system = platform.system()
                    print(f"Initiating restart for {system} based on command.")
                    if system == "Windows":
                        subprocess.run(["shutdown", "/r", "/t", "0"], shell=True)
                    elif system == "Linux":
                        subprocess.run(["sudo", "shutdown", "-r", "now"], check=True)
                    elif system == "Darwin":
                        subprocess.run(["sudo", "shutdown", "-r", "now"], check=True)
                    db_fb.child("restart_commands").child(local_serial).remove()
                    break  # Optional: break after executing restart
        except Exception as e:
            print(f"Error checking commands: {e}")
        time.sleep(10)



def firebase_shutdown_listener():
    firebase = pyrebase.initialize_app(firebase_config)
    db_fb = firebase.database()  # Use this variable for Firebase calls
    local_serial = get_serial_number()
    print(f"Firebase shutdown listener started for serial {local_serial}")
    
    while True:
        try:
            command_data = db_fb.child("shutdown_commands").child(local_serial).get().val()
            if command_data and command_data.get("command") == "shutdown":
                command_timestamp = command_data.get("timestamp")
                current_time = time.time()
                
                if command_timestamp and command_timestamp > 1e12:
                    command_timestamp = command_timestamp / 1000
                    
                print(f"Received shutdown command. Timestamp: {command_timestamp}, Current time: {current_time}")
                
                if command_timestamp and (current_time - command_timestamp) > 20:
                    print("Found an old shutdown command. Removing it.")
                    db_fb.child("shutdown_commands").child(local_serial).remove()
                else:
                    system = platform.system()
                    print(f"Initiating shutdown for {system} based on recent command.")
                    if system == "Windows":
                        subprocess.run(["shutdown", "/s", "/t", "0"], shell=True)
                    elif system == "Linux":
                        subprocess.run(["sudo", "shutdown", "now"], check=True)
                    elif system == "Darwin":
                        subprocess.run(["sudo", "shutdown", "-h", "now"], check=True)
                    db_fb.child("shutdown_commands").child(local_serial).remove()
                    break 
        except Exception as e:
            print(f"Error checking shutdown command: {e}")
        time.sleep(10)



@app.route('/serial', methods=['GET'])
def serial_api():
    """
    Returns the kiosk's serial number.
    """
    serial = get_serial_number()
    return jsonify({"serial_number": serial})

@app.route('/temperature', methods=['GET'])
def temperature_api():
    """
    Returns the GPU temperature.
    """
    temp = get_temperature()
    if temp is None:
        return jsonify({"error": "Could not retrieve temperature"}), 500
    return jsonify({"temperature": temp})

@app.route('/update-temp', methods=['POST'])
def update_temperature_api():
    """
    Retrieves the current GPU temperature and forwards it to the Node.js backend.
    """
    temp = get_temperature()
    if temp is None:
        temp=0
        return jsonify({"error": "Could not retrieve temperature"}), 500

    local_serial = get_serial_number()
    payload = {
        "SN": local_serial,
        "temperature": temp
    }

    # Replace with your Node.js backend endpoint.
    node_backend_url = "http://localhost:3000/api/kiosk/update-temperature"

    try:
        response = requests.post(node_backend_url, json=payload)
        return jsonify({
            "message": "Temperature sent successfully.",
            "temperature": temp,
            "nodeResponse": response.json()
        }), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def keep_online(interval=5):
    """
    Background task that continuously sets the kiosk's status to "online"
    with an updated timestamp and current temperature.
    """
    while True:
        current_temp = get_temperature()
        update_kiosk_status("online", {"last_heartbeat": time.time(), "temperature": current_temp})
        time.sleep(interval)

@app.route('/diagnostic', methods=['POST'])
def diagnostic_api():
    """
    Performs a detailed diagnostic check on the computer but only if the provided serial number matches.
    Also stores the diagnostic report in Firebase so it is publicly available.
    """
    try:
        data = request.get_json()
        provided_serial = data.get("serialNumber")

        if not provided_serial:
            return jsonify({"error": "Serial number is required."}), 400

        local_serial = get_serial_number()
        if provided_serial != local_serial:
            return jsonify({"error": "Serial number mismatch."}), 403

        # Basic system information
        diagnostic = {
            "os": platform.system(),
            "os_version": platform.version(),
            "platform": platform.platform(),
            "architecture": platform.machine(),
            "serial_number": local_serial,
            "cpu_count": os.cpu_count(),
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "cpu_frequency": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else {},
        }

        # Memory metrics
        virtual_mem = psutil.virtual_memory()
        diagnostic["memory"] = {
            "total_gb": round(virtual_mem.total / (1024**3), 2),
            "available_gb": round(virtual_mem.available / (1024**3), 2),
            "used_gb": round(virtual_mem.used / (1024**3), 2),
            "percent": virtual_mem.percent,
        }

        # Disk usage metrics
        partitions = psutil.disk_partitions()
        disk_info = {}
        for partition in partitions:
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disk_info[partition.mountpoint] = {
                    "total_gb": round(usage.total / (1024**3), 2),
                    "used_gb": round(usage.used / (1024**3), 2),
                    "free_gb": round(usage.free / (1024**3), 2),
                    "percent": usage.percent,
                }
            except Exception as e:
                disk_info[partition.mountpoint] = {"error": str(e)}
        diagnostic["disk_usage"] = disk_info

        # GPU temperature (if available)
        diagnostic["gpu_temperature"] = get_temperature()

        # Uptime
        diagnostic["uptime_seconds"] = round(time.time() - psutil.boot_time(), 2)

        # Network I/O statistics
        net_io = psutil.net_io_counters()
        diagnostic["network"] = {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "packets_sent": net_io.packets_sent,
            "packets_recv": net_io.packets_recv,
        }

        # Load average
        if hasattr(os, "getloadavg"):
            load1, load5, load15 = os.getloadavg()
            diagnostic["load_average"] = {"1min": load1, "5min": load5, "15min": load15}
        else:
            diagnostic["load_average"] = "Not available on this system"

        # Initialize pyrebase and write diagnostic data to Firebase
        firebase = pyrebase.initialize_app(firebase_config)
        db_fb = firebase.database()
        timestamp = int(time.time())
        diagnostic_data = {
            "timestamp": timestamp,
            "data": diagnostic
        }
        # Store under diagnostic_reports/{serial}
        db_fb.child("diagnostic_reports").child(local_serial).set(diagnostic_data)

        return jsonify(diagnostic)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # Start the Firebase command listener in a background thread.
    command_listener_thread = threading.Thread(target=firebase_command_listener, daemon=True)
    command_listener_thread.start()
    
    # Start the keep_online thread to constantly update the kiosk's status to "online".
    online_thread = threading.Thread(target=keep_online, daemon=True)
    online_thread.start()

    app.run(host='0.0.0.0', port=3000)
