#!/bin/bash

# Define the directory to watch
WATCH_DIR="/home/netcon/netplan/Network-configuration/PythonScript"

# Navigate to your project directory
cd "$WATCH_DIR" || exit

# Function to build and preview the project
start_server() {
    echo "Building project..."
    npm run build

    echo "Starting server..."
    npm run preview
}

# Initial start
start_server

# Monitor for changes in the project directory
inotifywait -m -r -e modify,create,delete "$WATCH_DIR" | while read -r path action file; do
    echo "Detected change: $action on $file in $path. Restarting server..."
    
    # Kill the previous server instance
    pkill -f "npm run preview"
    
    # Rebuild and start server again
    start_server
done
