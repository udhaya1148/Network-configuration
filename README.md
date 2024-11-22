# Network Configuration Utility
This project is a web-based utility built with React.js and Flask to display and update network configuration settings (IP address, subnet mask, gateway, DNS) for interfaces on an Ubuntu server. The backend uses Netplan to handle network configuration changes and psutil to monitor interface status.

# Features
* Display available network interfaces and their current configurations (IP, Subnet, Gateway, DNS).
* Update network settings, including support for both CIDR and subnet masks.
* Automatically apply changes using Netplan and bring interfaces up.
* Avahi integration for hostname resolution via .local.
* Installation & Setup

# Usage
* Access the web UI to view and modify network settings at http://your-server-ip:3000.
* The backend listens on http://your-server-ip:5000 and fetches interface data dynamically.


  # Install full dependencies
  ```
  sudo chmod +x /home/netcon/Network-configuration/dependencies.sh
  ```
  ```
  cd Network-configuration
  ```
  ```
  ./dependencies.sh
  ```
  
  # Install dependencies for python
  ```
  sudo apt install python3-flask-cors
  ```
  ```
  sudo apt install python3-psutil
  ```
  # Install Gunicorn
  ```
  sudo apt install -y gunicorn
  ```

  # Install Nodejs
  ```
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  ```
  ```
  sudo apt-get install nodejs -y
  ``` 
  # Install dependencies for react
  ```
  cd Network-configuration
  ```
  ```
  install npm
  ```
  ```
  npm install react-router-dom
  ```
  ```
  npm install react-icons --save
  ```
# Install TailwindCsss
```
npm install -D tailwindcss postcss autoprefixer
```
```
npx tailwindcss init -p
```
# Tailwindcss config.js
```
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```
# Setup Cronjob to run React and Python script 
```
cd Network-configuration
```
```
./setup_cronjob.sh
```

