import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

const ArpTable = () => {
  const [arpData, setArpData] = useState([]);
  const [error, setError] = useState(null);

  // Function to fetch ARP data
  const fetchArpData = async () => {
    try {
      const response = await fetch("/api2/arp");
      if (!response.ok) {
        throw new Error(`Failed to fetch ARP data: ${response.statusText}`);
      }
      const data = await response.json();

      // Ensure data is an array before setting state
      if (Array.isArray(data)) {
        setArpData(data);
        setError(null);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (err) {
      setError(err.message);
      setArpData([]);
    }
  };

  // useEffect for periodic data fetching
  useEffect(() => {
    fetchArpData();
    const interval = setInterval(fetchArpData, 2000); // Refresh every 2 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex h-screen w-screen mt=10">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto">
        <div className="border border-black p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-blue-600 text-3xl font-bold mb-4">ARP Table</h3>

          {/* Error Display */}
          {error && (
            <div className="text-red-600 font-semibold mb-4">
              Error: {error}
            </div>
          )}

          {/* Always display headings */}
          <div className="grid grid-cols-5 gap-4 font-bold border border-black bg-gray-200 p-3 rounded-md">
            <div className="text-gray-700">IP Address</div>
            <div className="text-gray-700">Hardware Type</div>
            <div className="text-gray-700">MAC Address</div>
            <div className="text-gray-700">Flags</div>
            <div className="text-gray-700">Interface</div>
          </div>

          {/* Display ARP Data */}
          {arpData.length > 0 ? (
            <div className="divide-y divide-gray-300">
              {arpData.map((entry, index) => (
                <div
                  key={index}
                  className="grid grid-cols-5 border border-black gap-4 items-center bg-gray-100 p-3 rounded-md mt-2"
                >
                  <div>{entry.ip || "N/A"}</div>
                  <div>{entry.hw_type || "N/A"}</div>
                  <div>{entry.mac || "N/A"}</div>
                  <div>{entry.flags || "N/A"}</div>
                  <div>{entry.iface || "N/A"}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 mt-4">No ARP data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArpTable;
