# Script for fetch arp data using arp -e and add static arp

import subprocess
from flask import Flask, jsonify, request
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Path to save the static ARP script
ARP_FILE_PATH = '/etc/networkd-dispatcher/routable.d/setarp-static'

# Get ARP table data
def get_arp_data():
    try:
        result = subprocess.run(['arp', '-e'], capture_output=True, text=True, check=True)
        arp_output = result.stdout
        arp_entries = []
        lines = arp_output.splitlines()

        for line in lines[1:]:
            columns = line.split()
            if len(columns) >= 5:
                ip = columns[0]
                hw_type = columns[1]
                mac = columns[2]
                flags = columns[3]
                iface = columns[4]

                arp_entries.append({
                    'ip': ip,
                    'hw_type': hw_type,
                    'mac': mac,
                    'flags': flags,
                    'iface': iface
                })

        return arp_entries

    except Exception as e:
        return {'error': str(e)}

# Get network interfaces
def get_interfaces():
    try:
        result = subprocess.run(['ip', 'link', 'show'], capture_output=True, text=True, check=True)
        interfaces_output = result.stdout
        interfaces = []
        
        for line in interfaces_output.splitlines():
            if 'state' in line:
                iface = line.split(':')[1].strip()
                interfaces.append(iface)

        return interfaces

    except Exception as e:
        return {'error': str(e)}

# Add static ARP entry, save to file, make executable, and run immediately without deleting existing entries
def add_static_arp(ip, mac, iface):
    try:
        # Static ARP entry command
        arp_entry = f"arp -s {ip} {mac} -i {iface}\n"
        
        # Check if the ARP entry already exists in the script
        if os.path.exists(ARP_FILE_PATH):
            with open(ARP_FILE_PATH, 'r') as file:
                existing_script = file.read()
                if arp_entry not in existing_script:
                    # Append the new ARP entry to the file if it doesn't exist
                    with open(ARP_FILE_PATH, 'a') as file:
                        file.write(arp_entry)
        else:
            # Create a new script if it doesn't exist
            script_content = f"#!/bin/bash\n{arp_entry}"
            with open(ARP_FILE_PATH, 'w') as file:
                file.write(script_content)

        # Make the file executable
        os.chmod(ARP_FILE_PATH, 0o755)  # 755 permissions to make it executable

        # Execute the script immediately
        subprocess.run(['bash', ARP_FILE_PATH], check=True)

        return {"message": "Static ARP entry added, script saved, and executed successfully"}
    except Exception as e:
        return {"error": f"Failed to add ARP entry: {str(e)}"}

# API endpoint to get ARP table
@app.route('/api/arp', methods=['GET'])
def get_arp_table():
    arp_data = get_arp_data()
    if 'error' in arp_data:
        return jsonify({'error': arp_data['error']}), 500
    return jsonify(arp_data)

# API endpoint to get network interfaces
@app.route('/api/interfaces', methods=['GET'])
def get_network_interfaces():
    interfaces = get_interfaces()
    if 'error' in interfaces:
        return jsonify({'error': interfaces['error']}), 500
    return jsonify(interfaces)

# API endpoint to add static ARP entry
@app.route('/api/arp/static', methods=['POST'])
def add_static_arp_entry():
    data = request.get_json()
    ip = data.get('ip')
    mac = data.get('mac')
    iface = data.get('iface')  # Assuming 'iface' is also provided by the frontend

    if ip and mac and iface:
        result = add_static_arp(ip, mac, iface)
        if 'error' in result:
            return jsonify(result), 500
        return jsonify(result)
    return jsonify({"error": "Missing required data"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
