#!/bin/bash

# Define paths
NETWORK_SCRIPT="/home/netcon/Network-configuration/PythonScript/Network-configuration.py"
ARP_SCRIPT="/home/netcon/Network-configuration/PythonScript/arp-pythonscript.py"
BIN_DIR="/bin"
VITE_SCRIPT="/home/netcon/Network-configuration/PythonScript/start-vite.sh"

# Remove existing copies in /bin
echo "Removing existing Network Configuration script from $BIN_DIR..."
sudo rm -f "$BIN_DIR/Network-configuration.py"
echo "Removing existing ARP script from $BIN_DIR..."
sudo rm -f "$BIN_DIR/arp-pythonscript.py"

# Copy new scripts to /bin
echo "Copying Network Configuration script to $BIN_DIR..."
sudo cp -i "$NETWORK_SCRIPT" "$BIN_DIR" || { echo "Failed to copy $NETWORK_SCRIPT"; exit 1; }
echo "Copying ARP script to $BIN_DIR..."
sudo cp -i "$ARP_SCRIPT" "$BIN_DIR" || { echo "Failed to copy $ARP_SCRIPT"; exit 1; }

# Make scripts executable
echo "Making scripts executable..."
sudo chmod +x "$BIN_DIR/Network-configuration.py"
sudo chmod +x "$BIN_DIR/arp-pythonscript.py"

# Remove old crontab entries (if they exist)
echo "Removing old crontab entries..."
crontab -l | grep -v "/bin/Network-configuration.py" | grep -v "/bin/arp-pythonscript.py" | crontab -

# Set up new crontab entries
echo "Setting up crontab..."
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /bin/Network-configuration.py") | crontab -
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /bin/arp-pythonscript.py") | crontab -

# Add crontab entry for start-vite.sh
echo "Setting up crontab for start-vite.sh..."
(crontab -l 2>/dev/null; echo "@reboot /bin/bash /home/netcon/Network-configuration/PythonScript/start-vite.sh") | crontab -

echo "Setup complete!"
