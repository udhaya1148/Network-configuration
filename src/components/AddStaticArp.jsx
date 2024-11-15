import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const ArpTable = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);
  const [ip, setIp] = useState("");
  const [mac, setMac] = useState(""); // Store raw MAC address without colons
  const [iface, setIface] = useState("");
  const [interfaces, setInterfaces] = useState([]);
  const [ipError, setIpError] = useState(""); // Track IP error state

  // Function to fetch ARP data
  const fetchArpData = async () => {
    try {
      const response = await fetch("http://10.0.0.44:8000/api/arp");
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
      const response = await fetch("http://10.0.0.44:8000/api/interfaces");
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

    const arpEntry = { ip, mac, iface };
    try {
      const response = await fetch("http://10.0.0.44:8000/api/arp/static", {
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
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // Function to validate IP address
  const isValidIp = (ipAddress) => {
    const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return regex.test(ipAddress);
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

  // Function to format MAC address for display with colons
  const formatMacForDisplay = (macAddress) => {
    return macAddress
      .replace(/[^a-fA-F0-9]/g, "") // Only keep hexadecimal characters
      .slice(0, 12) // Limit to 12 characters (6 pairs of hex)
      .replace(/(.{2})(?=.)/g, "$1:"); // Insert colons every two characters
  };

  // Handle MAC address input (remove colons for internal state)
  const handleMacChange = (e) => {
    const rawMac = e.target.value.replace(/[^a-fA-F0-9]/g, ""); // Remove non-hex characters
    setMac(rawMac); // Update state with raw MAC address (without colons)
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
        <div className="border border-gray-500 mb-2 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-blue-600 text-3xl font-bold">ARP Table</h3>
          <div className="flex items-center justify-between mt-4">
            <div className="font-bold flex-1">IP Address</div>
            <div className="font-bold flex-1">Hardware Type</div>
            <div className="font-bold flex-1">MAC Address</div>
            <div className="font-bold flex-1">Flags</div>
            <div className="font-bold flex-1">Interface</div>
          </div>
          {arpData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-200 rounded-lg p-4 mt-2 mb-2"
            >
              <div className="flex-1">{entry.ip}</div>
              <div className="flex-1">{entry.hw_type}</div>
              <div className="flex-1">{entry.mac}</div>
              <div className="flex-1">{entry.flags}</div>
              <div className="flex-1">{entry.iface}</div>
            </div>
          ))}
        </div>

        {/* Form for adding static ARP entry */}
        <div className="border border-gray-500 p-4 bg-white rounded-lg shadow-lg mt-6">
          <h4 className="text-xl font-bold mb-2">Add Static ARP </h4>
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
              value={formatMacForDisplay(mac)} // Format for display with colons
              onChange={handleMacChange}
              placeholder="e.g., AABBCCDDEEFF"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={handleAddStaticArp}
            className="bg-blue-600 text-white rounded-lg p-2"
          >
            Add Static ARP
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArpTable;
