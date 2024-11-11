from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import socket
import os
import subprocess
import yaml
import glob
import sys

# Check if Gunicorn is installed; if not, install it using apt
def check_and_install_gunicorn():
    try:
        # Attempt to check Gunicorn installation
        subprocess.check_call(['gunicorn', '--version'])
        print("Gunicorn is already installed.")
    except FileNotFoundError:
        # Gunicorn not found, install using apt
        print("Gunicorn is not installed. Installing Gunicorn using apt...")
        try:
            subprocess.check_call(['sudo', 'apt', 'update'])
            subprocess.check_call(['sudo', 'apt', 'install', '-y', 'gunicorn'])
            print("Gunicorn installed successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install Gunicorn: {e}")
            sys.exit(1)

# Install Gunicorn if necessary
check_and_install_gunicorn()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

def subnet_to_cidr(subnet):
    netmask = list(map(int, subnet.split('.')))
    return sum(bin(x).count('1') for x in netmask)

def get_network_info_from_netplan():
    netplan_config_path = '/etc/netplan'
    network_info = {}

    try:
        result = subprocess.run(['sudo', 'ls', netplan_config_path], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        if result.returncode != 0:
            raise Exception(f"Error accessing netplan directory: {result.stderr}")

        for yaml_file in glob.glob(os.path.join(netplan_config_path, '*.yaml')):
            with open(yaml_file, 'r') as f:
                config = yaml.safe_load(f)
                for interface, settings in config['network']['ethernets'].items():
                    interface_status = "Up" if psutil.net_if_stats()[interface].isup else "Down"
                    dhcp_status = "DHCP" if settings.get('dhcp4', False) else "Manual"
                    
                    network_info[interface] = {
                        "Status": interface_status,
                        "IP Address": '',
                        "Subnet Mask": '',
                        "Gateway": '',
                        "DNS": '',
                        "DHCP Status": dhcp_status
                    }

                    addrs = psutil.net_if_addrs().get(interface, [])
                    for addr in addrs:
                        if addr.family == socket.AF_INET:
                            network_info[interface]["IP Address"] = addr.address
                            network_info[interface]["Subnet Mask"] = f"{subnet_to_cidr(addr.netmask)}" if addr.netmask else ''

                    if 'routes' in settings:
                        for route in settings['routes']:
                            if route.get('to') == '0.0.0.0/0':
                                network_info[interface]["Gateway"] = route.get('via', '')

                    if 'nameservers' in settings:
                        dns_addresses = settings['nameservers'].get('addresses', [])
                        network_info[interface]["DNS"] = ', '.join(dns_addresses)

    except Exception as e:
        print(f"Error: {e}")

    return network_info

@app.route('/network-info', methods=['GET'])
def network_info():
    network_info = get_network_info_from_netplan()
    return jsonify({"network_info": network_info})

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
        netplan_files = glob.glob('/etc/netplan/*.yaml')
        if not netplan_files:
            return jsonify({'status': 'error', 'message': 'No Netplan configuration files found.'}), 400
        
        netplan_config_path = netplan_files[0]

        with open(netplan_config_path, 'r') as f:
            config = yaml.safe_load(f)

        if interface in config['network']['ethernets']:
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

        else:
            return jsonify({'status': 'error', 'message': f'Interface {interface} not found in Netplan configuration.'}), 400
        
        with open(netplan_config_path, 'w') as f:
            yaml.dump(config, f)

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

    try:
        subprocess.run(['sudo', 'netplan', 'apply'], check=True)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

    return jsonify({'status': 'success'})

def run_with_gunicorn():
    """Run the app with Gunicorn instead of Flask's development server."""
    # Get the script filename dynamically and remove the .py extension
    script_name = os.path.splitext(os.path.basename(__file__))[0]

    # Start Gunicorn with 4 worker processes
    subprocess.run(['gunicorn', '-w', '4', '-b', '0.0.0.0:8000', f'{script_name}:app'])

if __name__ == '__main__':
    run_with_gunicorn()
