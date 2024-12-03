#!/bin/bash

# Define paths for service files
NETWORK_CONFIG_SERVICE="/etc/systemd/system/Network-configuration.service"
ARP_SERVICE="/etc/systemd/system/Arp.service"
UI_SERVICE="/etc/systemd/system/ui.service"

# Define source paths for your service files
SRC_NETWORK_CONFIG="/root/Network-configuration/Service/Network-configuration.service"
SRC_ARP="/root/Network-configuration/Service/Arp.service"
SRC_UI="/root/Network-configuration/Service/ui.service"

# Copy service files to systemd directory
echo "Copying Network-configuration.service to $NETWORK_CONFIG_SERVICE"
sudo cp "$SRC_NETWORK_CONFIG" "$NETWORK_CONFIG_SERVICE"

echo "Copying Arp.service to $ARP_SERVICE"
sudo cp "$SRC_ARP" "$ARP_SERVICE"

echo "Copying ui.service to $UI_SERVICE"
sudo cp "$SRC_UI" "$UI_SERVICE"

# Set appropriate permissions
echo "Setting permissions for service files"
sudo chmod 644 "$NETWORK_CONFIG_SERVICE"
sudo chmod 644 "$ARP_SERVICE"
sudo chmod 644 "$UI_SERVICE"

# Reload systemd daemon to recognize new services
echo "Reloading systemd daemon"
sudo systemctl daemon-reload

# Enable the services to start at boot
echo "Enabling Network-configuration.service"
sudo systemctl enable Network-configuration.service

echo "Enabling Arp.service"
sudo systemctl enable Arp.service

echo "Enabling ui.service"
sudo systemctl enable ui.service

# Start the services
echo "Starting Network-configuration.service"
sudo systemctl start Network-configuration.service

echo "Starting Arp.service"
sudo systemctl start Arp.service

echo "Starting ui.service"
sudo systemctl start ui.service

# Check the status of the services
echo "Checking status of Network-configuration.service"
sudo systemctl status Network-configuration.service --no-pager

echo "Checking status of Arp.service"
sudo systemctl status Arp.service --no-pager

echo "Checking status of ui.service"
sudo systemctl status ui.service --no-pager
