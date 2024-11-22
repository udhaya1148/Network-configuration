from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import socket
import os
import subprocess
import yaml
import glob

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})



def get_physical_interfaces():
    """
    Retrieves a list of physical network interfaces available on the system.
    """
    try:
        # Get all network interfaces using ls command
        result = subprocess.run(['ls', '/sys/class/net'], stdout=subprocess.PIPE, text=True)
        interfaces = result.stdout.strip().split('\n')

        physical_interfaces = []
        for interface in interfaces:
            interface_path = f"/sys/class/net/{interface}/device"
            if os.path.exists(interface_path):  # Check if it's a physical interface
                physical_interfaces.append(interface)
        
        return physical_interfaces
    except Exception as e:
        print(f"Error occurred while retrieving interfaces: {e}")
        return []

def subnet_to_cidr(subnet):
    netmask = list(map(int, subnet.split('.')))
    return sum(bin(x).count('1') for x in netmask)

def get_available_interfaces():
    """Fetch available network interfaces using the custom method."""
    interfaces = {}
    physical_interfaces = get_physical_interfaces()

    for interface in physical_interfaces:
        try:
            # Get interface details using ip command
            result = subprocess.run(['ip', 'addr', 'show', interface], stdout=subprocess.PIPE, text=True)
            output = result.stdout
            
            # Extract IP address and subnet
            ip = None
            subnet = None
            for line in output.splitlines():
                if 'inet ' in line:
                    parts = line.strip().split()
                    ip = parts[1].split('/')[0]
                    subnet = parts[1].split('/')[1]
                    break

            interfaces[interface] = {
                "Status": "Up" if "state UP" in output else "Down",
                "IP Address": ip or "No IP",
                "Subnet Mask": subnet or "No Subnet",
                "DHCP Status": "Unknown",  # Will fetch from Netplan
                "Gateway": "N/A",          # Will fetch from Netplan
                "DNS": "N/A"               # Will fetch from Netplan
            }
        except Exception as e:
            print(f"Error fetching details for interface {interface}: {e}")

    return interfaces

def enrich_with_netplan(interfaces):
    """Fetch additional details from Netplan and enrich interface data."""
    netplan_config_path = '/etc/netplan'
    try:
        for yaml_file in glob.glob(os.path.join(netplan_config_path, '*.yaml')):
            with open(yaml_file, 'r') as f:
                config = yaml.safe_load(f)
                for iface, settings in config['network']['ethernets'].items():
                    if iface in interfaces:
                        interfaces[iface]["DHCP Status"] = "DHCP" if settings.get('dhcp4', False) else "Manual"
                        if 'routes' in settings:
                            for route in settings['routes']:
                                if route.get('to') == '0.0.0.0/0':
                                    interfaces[iface]["Gateway"] = route.get('via', 'N/A')
                        if 'nameservers' in settings:
                            dns_addresses = settings['nameservers'].get('addresses', [])
                            interfaces[iface]["DNS"] = ', '.join(dns_addresses)
    except Exception as e:
        print(f"Error reading Netplan configuration: {e}")

    return interfaces

@app.route('/network-info', methods=['GET'])
def network_info():
    interfaces = get_available_interfaces()
    enriched_interfaces = enrich_with_netplan(interfaces)
    return jsonify({"network_info": enriched_interfaces})

@app.route('/update-network', methods=['POST'])
def update_network():
    data = request.json
    interface = data.get('interface')
    ip = data.get('ip')
    subnet = data.get('subnet')
    gateway = data.get('gateway')
    dns_servers = data.get('dns')
    dhcp_enabled = data.get('dhcp')

    try:
        # Find the first Netplan configuration file
        netplan_files = glob.glob('/etc/netplan/*.yaml')
        if not netplan_files:
            return jsonify({'status': 'error', 'message': 'No Netplan configuration files found.'}), 400
        
        netplan_config_path = netplan_files[0]

        # Load the Netplan configuration
        with open(netplan_config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Check if the interface exists, add it if missing
        if 'ethernets' not in config['network']:
            config['network']['ethernets'] = {}

        if interface not in config['network']['ethernets']:
            config['network']['ethernets'][interface] = {}

        # Update the configuration for the interface
        if dhcp_enabled:
            config['network']['ethernets'][interface]['dhcp4'] = True
            config['network']['ethernets'][interface]['dhcp6'] = True
            config['network']['ethernets'][interface].pop('addresses', None)
            config['network']['ethernets'][interface].pop('nameservers', None)
            config['network']['ethernets'][interface].pop('gateway4', None)
            config['network']['ethernets'][interface].pop('routes', None)
        else:
            if not subnet or not ip or not gateway or not dns_servers:
                return jsonify({'status': 'error', 'message': 'All fields are required when DHCP is disabled.'}), 400

            # Calculate CIDR if necessary
            if subnet.startswith('/'):
                cidr_value = subnet.split('/')[1]
            elif subnet.count('.') == 3:
                cidr_value = subnet_to_cidr(subnet)
            elif subnet.isdigit() and 0 <= int(subnet) <= 32:
                cidr_value = subnet
            else:
                return jsonify({'status': 'error', 'message': 'Invalid subnet format.'}), 400

            config['network']['ethernets'][interface]['dhcp4'] = False
            config['network']['ethernets'][interface]['dhcp6'] = False

            config['network']['ethernets'][interface]['addresses'] = [f"{ip}/{cidr_value}"]
            config['network']['ethernets'][interface]['nameservers'] = {'addresses': dns_servers}

            existing_routes = config['network']['ethernets'][interface].get('routes', [])
            default_route = {'to': '0.0.0.0/0', 'via': gateway, 'metric': 100 + len(existing_routes)}
            config['network']['ethernets'][interface]['routes'] = [default_route]

        # Write the updated configuration back to the file
        with open(netplan_config_path, 'w') as f:
            yaml.dump(config, f)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

    try:
        # Apply the Netplan configuration
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

    return jsonify({'status': 'success', 'message': f'Interface {interface} updated successfully.'})


if __name__ == '__main__':
    # Get the script filename
    script_filename = os.path.basename(__file__)

    # Use subprocess to call gunicorn dynamically
    subprocess.run([
        'gunicorn',
        '-w', '4',          # Number of worker processes
        '-b', '0.0.0.0:5001', # Bind to 0.0.0.0:5001
        script_filename.replace('.py', ':app')  # Dynamically pass the app name
    ])
