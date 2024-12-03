#!/bin/bash

# Set proper PATH to ensure npm and other executables are found
export PATH=$PATH:/usr/local/bin:/usr/bin

# Navigate to the project directory
cd /root/Network-configuration/PythonScript || exit 1

# Ensure npm dependencies are installed
npm install

# Build the project
npm run build || { echo "Build failed"; exit 1; }

# Start the server using npm run preview
npm run preview || { echo "Failed to start preview"; exit 1; }
