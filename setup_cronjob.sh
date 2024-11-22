#!/bin/bash

# Function to copy and make executable
setup_script() {
  local src_path="$1"
  local dest_path="$2"
  local description="$3"
  echo "Setting up $description"

  # Check if the destination file exists and remove it before copying
  if [ -f "$dest_path" ]; then
    echo "Removing existing file at $dest_path"
    sudo rm -f "$dest_path"
  fi

  sudo cp "$src_path" "$dest_path"
  sudo chmod +x "$dest_path"
}

# Network-Configuration setup
setup_script "/home/netcon/Network-configuration/PythonScript/Network-configuration.py" "/bin/Network-configuration.py" "Network-configuration.py"
sudo crontab -l | grep -v "/bin/Network-configuration.py" | { cat; echo "@reboot /usr/bin/python3 /bin/Network-configuration.py"; } | sudo crontab -

# Static-arp setup
setup_script "/home/netcon/Network-configuration/PythonScript/arp-pythonscript.py" "/bin/arp-pythonscript.py" "arp-pythonscript.py"
sudo crontab -l | grep -v "/bin/arp-pythonscript.py" | { cat; echo "@reboot /usr/bin/python3 /bin/arp-pythonscript.py"; } | sudo crontab -

# React app setup
setup_script "/home/netcon/Network-configuration/PythonScript/start-vite.sh" "/bin/start-vite.sh" "start-vite.sh"
sudo crontab -l | grep -v "/home/netcon/Network-configuration/PythonScript/start-vite.sh" | { cat; echo "@reboot /home/netcon/Network-configuration/PythonScript/start-vite.sh"; } | sudo crontab -

echo "Setup complete!"
