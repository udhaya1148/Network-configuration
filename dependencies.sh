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
    sudo npm install -g npm@latest || { echo "Failed to install npm dependencies"; exit 1; }

   # npm install || { echo "Failed to install npm dependencies"; exit 1; }
    npm install react-router-dom 
    npm install react-icons --save || { echo "Failed to install React packages"; exit 1; }

    # Install TailwindCSS
    npm install -D tailwindcss postcss autoprefixer || { echo "Failed to install TailwindCSS"; exit 1; }
    npx tailwindcss init -p || { echo "Failed to initialize TailwindCSS"; exit 1; }
else
    echo "Directory $BASE_PATH not found. Exiting."
    exit 1
fi


echo "Setup complete!"
