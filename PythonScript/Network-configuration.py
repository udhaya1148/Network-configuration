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

def get_gateway_from_networkctl(interface):
    """Fetch the gateway for a specific interface using the `networkctl` command."""
    try:
        result = subprocess.run(['networkctl', 'status', interface], stdout=subprocess.PIPE, text=True)
        output = result.stdout

        # Parse gateway from the output
        for line in output.splitlines():
            if 'Gateway:' in line:
                gateway = line.split('Gateway:')[1].strip().split()[0]  # Extract the gateway IP
                return gateway
    except Exception as e:
        print(f"Error fetching gateway for {interface}: {e}")
    return "N/A"

def get_dns_for_interface(interface):
    """Fetch DNS information for a specific interface using resolvectl."""
    try:
        result = subprocess.run(['resolvectl', 'status', interface], stdout=subprocess.PIPE, text=True)
        output = result.stdout

        # Parse DNS Servers
        dns_servers = []
        for line in output.splitlines():
            if "DNS Servers" in line:
                dns_servers.extend(line.split("DNS Servers:")[1].strip().split())
        return ', '.join(dns_servers) if dns_servers else "N/A"
    except Exception as e:
        print(f"Error fetching DNS for {interface}: {e}")
        return "N/A"

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

            # Fetch gateway using networkctl
            gateway = get_gateway_from_networkctl(interface)
            
            # Fetch DNS using resolvectl
            dns = get_dns_for_interface(interface)

            interfaces[interface] = {
                "Status": "Up" if "state UP" in output else "Down",
                "IP Address": ip or "No IP",
                "Subnet Mask": subnet or "No Subnet",
                "DHCP Status": "Unknown",  # Will fetch from Netplan
                "Gateway": gateway,
                "DNS": dns
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
    """
    Updates the network configuration for a given interface based on the provided
    JSON payload.
    """
    data = request.json
    interface = data.get('interface')
    ip = data.get('ip')
    subnet = data.get('subnet')
    gateway = data.get('gateway', None)
    dns_servers = data.get('dns', None)
    dhcp_enabled = data.get('dhcp', None)

    try:
        # Find the first Netplan configuration file
        netplan_files = glob.glob('/etc/netplan/*.yaml')
        if not netplan_files:
            return jsonify({'status': 'error', 'message': 'No Netplan configuration files found.'}), 400

        netplan_config_path = netplan_files[0]
        with open(netplan_config_path, 'r') as f:
            config = yaml.safe_load(f)

        # Ensure the 'ethernets' key exists
        config.setdefault('network', {}).setdefault('ethernets', {})
        interface_config = config['network']['ethernets'].setdefault(interface, {})

        if dhcp_enabled:
            # Enable DHCP and clear static configurations
            interface_config['dhcp4'] = True
            interface_config['dhcp6'] = True
            interface_config.pop('addresses', None)
            interface_config.pop('nameservers', None)
            interface_config.pop('routes', None)
        else:
            # Validate IP address and subnet when DHCP is disabled
            if not ip or not subnet:
                return jsonify({'status': 'error', 'message': 'IP address and subnet are required when DHCP is disabled.'}), 400

            # Handle subnet mask and CIDR notation
            if '/' in subnet:
                cidr = subnet.split('/')[1]
            elif subnet.count('.') == 3:
                cidr = subnet_to_cidr(subnet)
            elif subnet.isdigit() and 0 <= int(subnet) <= 32:
                cidr = subnet
            else:
                return jsonify({'status': 'error', 'message': 'Invalid subnet format.'}), 400

            # Update static IP configuration
            interface_config['dhcp4'] = False
            interface_config['dhcp6'] = False
            interface_config['addresses'] = [f"{ip}/{cidr}"]

            # Handle DNS configuration
            if dns_servers:
                interface_config['nameservers'] = {'addresses': dns_servers}
            else:
                interface_config.pop('nameservers', None)

            # Handle Gateway configuration
            if gateway:
                interface_config['routes'] = [{'to': '0.0.0.0/0', 'via': gateway, 'metric': 100}]
            else:
                interface_config.pop('routes', None)

        # Write back the updated configuration
        with open(netplan_config_path, 'w') as f:
            yaml.dump(config, f)

        # Apply the changes using Netplan
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)

        # Bring up the interface if it's down
        subprocess.run(['sudo', 'ip', 'link', 'set', interface, 'up'], check=False)

        return jsonify({'status': 'success', 'message': 'Network configuration updated and saved permanently!'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

def check_os_version():
    """Check the OS version and return it."""
    try:
        with open("/etc/os-release") as f:
            os_info = {}
            for line in f:
                key, value = line.strip().split("=", 1)
                os_info[key] = value.strip('"')
            return os_info.get("VERSION_ID", "Unknown")
    except Exception as e:
        print(f"Error checking OS version: {e}")
        return "Unknown"

def setup_network_for_ubuntu22():
    """Set up network configuration specific to Ubuntu 22.04."""
    try:
        # Disable Network Configuration in Cloud-Init
        with open("/etc/cloud/cloud.cfg.d/99-disable-network-config.cfg", "w") as f:
            f.write("network: {config: disabled}\n")
        
        # Regenerate the Network Configuration
        netplan_config = """
network:
    version: 2
    ethernets:
        enp4s0:
            dhcp4: true
"""
        with open("/etc/netplan/50-cloud-init.yaml", "w") as f:
            f.write(netplan_config)
        
        # Apply the New Configuration
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)
        print("Network configuration applied successfully.")
    except Exception as e:
        print(f"Error setting up network for Ubuntu 22: {e}")

if __name__ == "__main__":
    os_version = check_os_version()
    print(f"Detected OS version: {os_version}")
    
    if os_version == "22.04":
        print("Ubuntu 22.04 detected. Setting up network configuration.")
        setup_network_for_ubuntu22()
    else:
        print(f"OS version {os_version} is not explicitly handled. Proceeding with default logic.")

    script_filename = os.path.basename(__file__)
    subprocess.run([
        'gunicorn',
        '-w', '4',          # Number of worker processes
        '-b', '0.0.0.0:5001', # Bind to 0.0.0.0:5001
        script_filename.replace('.py', ':app')  # Dynamically pass the app name
    ])
