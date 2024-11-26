import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const AddStaticArp = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [ip, setIp] = useState("");
  const [mac, setMac] = useState("");
  const [interfaces, setInterfaces] = useState([]);
  const [ipError, setIpError] = useState("");

  const fetchArpData = async () => {
    try {
      const response = await fetch("http://172.18.1.172:5002/arp");
      if (!response.ok) {
        throw new Error("Failed to fetch ARP data");
      }
      const data = await response.json();
      setArpData(data);
      setError(null); // Clear any previous error
    } catch (error) {
      setError("Failed to fetch ARP data.");
    }
  };

  const fetchInterfaces = async () => {
    try {
      const response = await fetch("http://172.18.1.172:5002/interfaces");
      if (!response.ok) {
        throw new Error("Failed to fetch interfaces");
      }
      const data = await response.json();
      setInterfaces(data);
      setError(null); // Clear any previous error
    } catch (error) {
      setError("Failed to fetch interfaces. Backend might not be running.");
    }
  };

  const handleAddStaticArp = async () => {
    if (!isValidIp(ip)) {
      setIpError("Invalid IP address format.");
      return;
    }

    const arpEntry = { ip, mac };
    try {
      const response = await fetch("http://172.18.1.172:5002/static", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(arpEntry),
      });
      const result = await response.json();
      if (response.ok) {
        setSuccessMessage("Static ARP entry added successfully!");
        setError(null);
        fetchArpData();
        setIp("");
        setMac("");
        setIpError("");
      } else {
        setSuccessMessage(null);
        setError(result.error || "Failed to add ARP entry.");
      }
    } catch (error) {
      setSuccessMessage(null);
      setError(error.message);
    }
  };

  const isValidIp = (ipAddress) => {
    const segments = ipAddress.split(".");
    if (segments.length !== 4) return false;

    return segments.every((segment) => {
      if (!/^\d+$/.test(segment)) return false; // Check if segment is a number
      const num = parseInt(segment, 10);
      return num >= 0 && num <= 255 && (segment.length === 1 || !segment.startsWith("0"));
    });
  };

  useEffect(() => {
    fetchArpData();
    fetchInterfaces();
    const interval = setInterval(fetchArpData, 2000);
    return () => clearInterval(interval); // Clear the interval on cleanup
  }, []);

  const handleIpChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers and dots
    setIp(value);
    if (isValidIp(value)) {
      setIpError(""); // Clear error if IP is valid
    } else {
      setIpError("Invalid IP address format."); // Set error message if invalid
    }
  };

  const formatMacForDisplay = (macAddress) => {
    return macAddress
      .replace(/[^a-fA-F0-9]/g, "")
      .slice(0, 12)
      .replace(/(.{2})(?=.)/g, "$1:");
  };

  const handleMacChange = (e) => {
    const rawMac = e.target.value.replace(/[^a-fA-F0-9]/g, "");
    setMac(rawMac);
  };

  return (
    <div className="flex h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto">
        <div className="border border-black p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-blue-600 text-3xl font-bold mb-4">ARP Table</h3>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-semibold mb-4">
              Error: {error}
            </div>
          )}

          {/* Table Headings */}
          <div className="flex items-center justify-between mt-4 bg-gray-200 border border-black p-2 rounded-lg">
            <div className="font-bold flex-1">IP Address</div>
            <div className="font-bold flex-1">Hardware Type</div>
            <div className="font-bold flex-1">MAC Address</div>
            <div className="font-bold flex-1">Flags</div>
            <div className="font-bold flex-1">Interface</div>
          </div>

          {/* ARP Data */}
          {arpData?.length === 0 && (
            <div className="text-center text-gray-500 mt-4">
              No ARP entries found.
            </div>
          )}
          {arpData.map((entry, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-100 border border-black rounded-lg mt-2"
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
        <div className="border border-black p-6 bg-white rounded-lg shadow-lg mt-6">
          <h4 className="text-xl text-blue-600 font-bold mb-4">Add Static ARP</h4>

          {/* Success Message */}
          {successMessage && (
            <div className="text-green-500 text-sm mb-4">{successMessage}</div>
          )}

          <div className="mb-4">
            <label className="block text-black font-bold mb-2">
              IP Address :
            </label>
            <input
              type="text"
              value={ip}
              onChange={handleIpChange}
              placeholder="e.g., 192.168.0.1"
              className="w-full p-2 border border-black rounded-lg"
            />
            {ipError && <div className="text-red-500 text-sm">{ipError}</div>}
          </div>

          <div className="mb-4">
            <label className="block text-black font-bold mb-2">
              MAC Address :
            </label>
            <input
              type="text"
              value={formatMacForDisplay(mac)}
              onChange={handleMacChange}
              placeholder="e.g., AABBCCDDEEFF"
              className="w-full p-2 border border-black rounded-lg"
            />
          </div>

          <button
            onClick={handleAddStaticArp}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Static ARP
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaticArp;
