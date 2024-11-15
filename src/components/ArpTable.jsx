import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const ArpTable = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);

  // Function to fetch ARP data
  const fetchArpData = async () => {
    try {
      const response = await fetch("http://172.18.1.224:8000/api/arp");
      if (!response.ok) {
        throw new Error(`Failed to fetch ARP data: ${response.statusText}`);
      }
      const data = await response.json();
      setArpData(data);
      setError(null); // Clear the error when data fetch is successful
    } catch (err) {
      setError(err.message);
      setArpData([]); // clear the ARP data to avoid showing stale data
    }
  };

  // useEffect for periodic data fetching
  useEffect(() => {
    fetchArpData();
    const interval = setInterval(fetchArpData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
        <div className="border border-gray-500 mb-2 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-blue-600 text-3xl font-bold">ARP Table</h3>

          {/* Error display */}
          {error && (
            <div className="text-red-600 font-bold mb-4">
              Error: {error}
            </div>
          )}

          {/* ARP table header */}
          <div className="flex items-center justify-between mt-4 font-bold">
            <div className="flex-1">IP Address</div>
            <div className="flex-1">Hardware Type</div>
            <div className="flex-1">MAC Address</div>
            <div className="flex-1">Flags</div>
            <div className="flex-1">Interface</div>
          </div>

          {/* ARP table rows */}
          {arpData.length > 0 ? (
            arpData.map((entry, index) => (
              <div
                key={entry.id || index} // Ensure unique keys
                className="flex items-center justify-between bg-gray-200 rounded-lg p-4 mt-2 mb-2"
              >
                <div className="flex-1">{entry.ip || "N/A"}</div>
                <div className="flex-1">{entry.hw_type || "N/A"}</div>
                <div className="flex-1">{entry.mac || "N/A"}</div>
                <div className="flex-1">{entry.flags || "N/A"}</div>
                <div className="flex-1">{entry.iface || "N/A"}</div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 mt-4">No ARP data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArpTable;
