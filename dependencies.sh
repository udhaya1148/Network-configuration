#!/bin/bash

sudo apt update

# Install Gunicorn
sudo apt install -y gunicorn

# Install Dependencies  for flask
sudo apt install python3-flask-cors
sudo apt install python3-psutil

# Install Dependencies for vite-react
sudo apt install npm
npm install react-router-dom
npm install react-icons --save

# Install TailwindCss
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# add exection permission for file
sudo chmod +x /bin/Network-configuration.py
sudo chmod +x /bin/arp-pythonscript.py
sudo chmod +x /home/netcon/Network-configuration/PythonScript/start-vite.sh



