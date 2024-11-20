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

# Network Configuration
sudo cp -i /home/netcon/Network-configuration/PythonScript/Network-configuration.py /bin
sudo chmod +x /bin/Network-configuration.py
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /bin/Network-configuration1.py") | sudo crontab -

# Static ARP
sudo cp -i /home/netcon/Network-configuration/PythonScript/arp-pythonscript.py /bin
sudo chmod +x /bin/arp-pythonscript.py
(crontab -l 2>/dev/null; echo "@reboot /usr/bin/python3 /bin/arp-pythonscript1.py") | sudo crontab -

# React Application
sudo chmod +x /home/netcon/Network-configuration/PythonScript/start-vite.sh
(crontab -l 2>/dev/null; echo "@reboot /home/netcon/Network-configuration/PythonScript/start-vite1.sh") | sudo crontab -

echo "Setup completed successfully!"



