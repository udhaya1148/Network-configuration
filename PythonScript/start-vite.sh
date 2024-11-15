#!/bin/bash

# Set your project directory
WATCH_DIR="/home/netcon/netplan/Network-configuration/PythonScript"

# Navigate to your project directory
cd "$WATCH_DIR" || { echo "Failed to change directory to $WATCH_DIR"; exit 1; }

# Function to build and start the server
start_server() {
    echo "Building project..."
    npm run build

    echo "Starting server..."
    # Start the server in the background so we can kill it when needed
    npm run preview &
    SERVER_PID=$!
}

# Initial build and start
start_server

# Install inotify-tools if it's not installed
if ! command -v inotifywait &> /dev/null; then
    echo "Installing inotify-tools..."
    sudo apt update && sudo apt install -y inotify-tools
fi

# Monitor the directory for changes and restart the server
inotifywait -m -r -e modify,create,delete "$WATCH_DIR" |
while read -r directory action file; do
    echo "Detected $action on $file. Restarting server..."
    
    # Kill the previous server instance
    if [[ -n $SERVER_PID ]]; then
        kill $SERVER_PID
    fi
    
    # Restart the server
    start_server
done
