import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const DeleteArp = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);
  const [ip, setIp] = useState("");
  const [mac, setMac] = useState(""); // Added MAC address state for adding entries
  const [iface, setIface] = useState("");
  const [interfaces, setInterfaces] = useState([]);
  const [ipError, setIpError] = useState(""); // Track IP error state
  const [macError, setMacError] = useState(""); // Track MAC error state

  // Function to fetch ARP data
  const fetchArpData = async () => {
    try {
      const response = await fetch("http://172.18.1.224:8000/api/arp");
      if (!response.ok) {
        throw new Error("Failed to fetch ARP data");
      }
      const data = await response.json();
      setArpData(data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Function to fetch available network interfaces for the select dropdown
  const fetchInterfaces = async () => {
    try {
      const response = await fetch("http://172.18.1.224:8000/api/interfaces");
      if (!response.ok) {
        throw new Error("Failed to fetch interfaces");
      }
      const data = await response.json();
      setInterfaces(data);
    } catch (error) {
      setError(error.message);
    }
  };

  // Function to handle adding a static ARP entry
  const handleAddStaticArp = async () => {
    if (!isValidIp(ip)) {
      setIpError("Invalid IP address format.");
      return;
    }

    if (!isValidMac(mac)) {
      setMacError("Invalid MAC address format.");
      return;
    }

    const arpEntry = { ip, mac, iface };
    try {
      const response = await fetch("http://172.18.1.224:8000/api/arp/static", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arpEntry),
      });
      const result = await response.json();
      if (response.ok) {
        alert("Static ARP entry added successfully!");
        fetchArpData(); // Refresh the ARP table after adding entry
        // Clear input fields
        setIp("");
        setMac("");
        setIface("");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Function to handle deleting a static ARP entry
  const handleDeleteStaticArp = async () => {
    if (!isValidIp(ip)) {
      setIpError("Invalid IP address format.");
      return;
    }

    const arpEntry = { ip, iface };
    try {
      const response = await fetch("http://172.18.1.224:8000/api/arp/static", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arpEntry),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Static ARP entry deleted successfully!");
        fetchArpData(); // Refresh the ARP table after deleting entry
        // Clear input fields
        setIp("");
        setIface("");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Function to validate IP address
  const isValidIp = (ipAddress) => {
    const regex = /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
    return regex.test(ipAddress);
  };

  // Function to validate MAC address
  const isValidMac = (macAddress) => {
    const regex = /^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/;
    return regex.test(macAddress);
  };

  useEffect(() => {
    fetchArpData();
    fetchInterfaces();
    const interval = setInterval(fetchArpData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Handle IP address input without dots
  const handleIpChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers and dots
    setIp(value);
    if (isValidIp(value)) {
      setIpError(""); // Clear error if IP is valid
    }
  };

  // Handle MAC address input
  const handleMacChange = (e) => {
    const value = e.target.value.toLowerCase();
    setMac(value);
    if (isValidMac(value)) {
      setMacError(""); // Clear error if MAC is valid
    }
  };

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
        {/* ARP Table Display */}
        <div className="border border-gray-500 mb-4 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-blue-600 text-3xl font-bold">ARP Table</h3>
          <div className="flex items-center justify-between mt-4 bg-gray-100 p-2 rounded">
            <div className="font-bold flex-1">IP Address</div>
            <div className="font-bold flex-1">Hardware Type</div>
            <div className="font-bold flex-1">MAC Address</div>
            <div className="font-bold flex-1">Flags</div>
            <div className="font-bold flex-1">Interface</div>
          </div>
          {arpData.length === 0 && (
            <div className="text-center text-gray-500 mt-4">No ARP entries found.</div>
          )}
          {arpData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-200 rounded-lg mt-2"
            >
              <div className="flex-1">{entry.ip}</div>
              <div className="flex-1">{entry.hw_type}</div>
              <div className="flex-1">{entry.mac}</div>
              <div className="flex-1">{entry.flags}</div>
              <div className="flex-1">{entry.iface}</div>
            </div>
          ))}
        </div>

        {/* Form for Adding Static ARP Entry */}
        <div className="border border-gray-500 p-4 bg-white rounded-lg shadow-lg mb-6">
          <h4 className="text-xl text-green-600 font-bold mb-2">Add Static ARP</h4>
          <div className="mb-4">
            <label className="block font-bold">Interface</label>
            <select
              value={iface}
              onChange={(e) => setIface(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Interface</option>
              {interfaces.map((interfaceItem, index) => (
                <option key={index} value={interfaceItem}>
                  {interfaceItem}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold">IP Address</label>
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="e.g., 192.168.0.1"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {ipError && <div className="text-red-500 text-sm">{ipError}</div>}
          </div>
          <div className="mb-4">
            <label className="block font-bold">MAC Address</label>
            <input
              type="text"
              value={mac}
              onChange={handleMacChange}
              placeholder="e.g., aa:bb:cc:dd:ee:ff"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {macError && <div className="text-red-500 text-sm">{macError}</div>}
          </div>

          <button
            onClick={handleAddStaticArp}
            className="bg-green-600 text-white rounded-lg p-2 mt-2"
          >
            Add ARP Entry
          </button>
        </div>

        {/* Form for Deleting Static ARP Entry */}
        <div className="border border-gray-500 p-4 bg-white rounded-lg shadow-lg">
          <h4 className="text-xl text-red-600 font-bold mb-2">Delete Static ARP</h4>
          <div className="mb-4">
            <label className="block font-bold">Interface</label>
            <select
              value={iface}
              onChange={(e) => setIface(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Interface</option>
              {interfaces.map((interfaceItem, index) => (
                <option key={index} value={interfaceItem}>
                  {interfaceItem}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block font-bold">IP Address</label>
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="e.g., 192.168.0.1"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            {ipError && <div className="text-red-500 text-sm">{ipError}</div>}
          </div>

          <button
            onClick={handleDeleteStaticArp}
            className="bg-red-600 text-white rounded-lg p-2"
          >
            Delete ARP Entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteArp;

