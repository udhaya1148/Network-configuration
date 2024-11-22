#!/bin/bash

# Update package lists
sudo apt update

# Install Gunicorn
sudo apt install -y gunicorn || { echo "Failed to install Gunicorn"; exit 1; }

# Install Python dependencies for Flask
sudo apt install -y python3-flask-cors python3-psutil || { echo "Failed to install Flask dependencies"; exit 1; }

# Install Node.js and npm
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs  || { echo "Failed to install Node.js and npm"; exit 1; }

# React app setup
BASE_PATH="$HOME/Network-configuration"
if [ -d "$BASE_PATH" ]; then
    cd "$BASE_PATH" || { echo "Failed to navigate to $BASE_PATH"; exit 1; }

    # Install React and dependencies
    npm install || { echo "Failed to install npm dependencies"; exit 1; }
    npm install react-router-dom 
    npm install react-icons --save || { echo "Failed to install React packages"; exit 1; }

    # Install TailwindCSS
    npm install -D tailwindcss postcss autoprefixer || { echo "Failed to install TailwindCSS"; exit 1; }
    npx tailwindcss init -p || { echo "Failed to initialize TailwindCSS"; exit 1; }
else
    echo "Directory $BASE_PATH not found. Exiting."
    exit 1
fi

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

# Setup Python and React scripts
setup_script "$BASE_PATH/PythonScript/Network-configuration.py" "/bin/Network-configuration.py" "Network-configuration.py"
setup_script "$BASE_PATH/PythonScript/arp-pythonscript.py" "/bin/arp-pythonscript.py" "arp-pythonscript.py"
setup_script "$BASE_PATH/PythonScript/start-vite.sh" "/bin/start-vite.sh" "start-vite.sh"

# Setup crontab entries
sudo crontab -l > mycron || true
{
    echo "@reboot /usr/bin/python3 /bin/Network-configuration.py"
    echo "@reboot /usr/bin/python3 /bin/arp-pythonscript.py"
    echo "@reboot /bin/start-vite.sh"
} >> mycron
sudo crontab mycron
rm mycron

echo "Setup complete!"
