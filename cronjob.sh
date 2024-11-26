# Function to copy and make executable
setup_script() {
    local src_path="$1"
    local dest_path="$2"
    local description="$3"

    echo "Setting up $description"

    # Check if the source file exists
    if [ ! -f "$src_path" ]; then
        echo "Source file $src_path not found. Skipping $description."
        return
    fi

    # Remove existing file at destination
    [ -f "$dest_path" ] && sudo rm -f "$dest_path"

    # Copy and set permissions
    sudo cp "$src_path" "$dest_path"
    sudo chmod +x "$dest_path"
}

# Script to copy files on reboot
BOOT_SCRIPT="/bin/setup-reboot-scripts.sh"

cat <<EOF | sudo tee "$BOOT_SCRIPT"
#!/bin/bash
setup_script "$BASE_PATH/PythonScript/Network-configuration.py" "/bin/Network-configuration.py" "Network-configuration.py"
setup_script "$BASE_PATH/PythonScript/arp-pythonscript.py" "/bin/arp-pythonscript.py" "arp-pythonscript.py"
setup_script "$BASE_PATH/PythonScript/start-vite.sh" "/bin/start-vite.sh" "start-vite.sh"
EOF

sudo chmod +x "$BOOT_SCRIPT"

# Add crontab entries to run scripts at reboot
sudo crontab -l > mycron || true
{
    echo "@reboot $BOOT_SCRIPT"
    echo "@reboot /usr/bin/python3 /bin/Network-configuration.py"
    echo "@reboot /usr/bin/python3 /bin/arp-pythonscript.py"
    echo "@reboot /bin/start-vite.sh"
} >> mycron
sudo crontab mycron
rm mycron

echo "Setup complete!"
