import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";

function NetworkConfiguration() {
  const [networkInfo, setNetworkInfo] = useState({});
  const [selectedInterface, setSelectedInterface] = useState("");
  const [ip, setIp] = useState("");
  const [subnet, setSubnet] = useState("");
  const [gateway, setGateway] = useState("");
  const [dns, setDns] = useState("");
  const [dhcpEnabled, setDhcpEnabled] = useState("DHCP");

  useEffect(() => {
    fetchNetworkInfo();
    const interval = setInterval(fetchNetworkInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkInfo = () => {
    fetch(`/api1/network-info?ts=${new Date().getTime()}`)
      .then((response) => response.json())
      .then((data) => setNetworkInfo(data.network_info))
      .catch((error) => console.error("Error fetching network info:", error));
  };

  const handleUpdate = () => {
    // Validate if IP and Subnet are required in Manual configuration
    if (dhcpEnabled === "Manual" && (!ip || !subnet)) {
      alert("IP Address and Subnet are mandatory fields!");
      return;
    }

    // Prepare the payload with optional DNS and Gateway
    const payload = {
      interface: selectedInterface,
      ip: dhcpEnabled === "DHCP" ? "" : ip,
      subnet: dhcpEnabled === "DHCP" ? "" : subnet,
      gateway: gateway ? gateway : null, // Set Gateway to null if not provided
      dns: dns ? dns.split(",").map((d) => d.trim()) : [], // DNS array if provided
      dhcp: dhcpEnabled === "DHCP",
    };

    // If gateway is missing, don't send it, so netplan can use the default route
    if (!gateway) {
      delete payload.gateway;
    }

    // If DNS is missing, don't send it, so netplan can use the default DNS configuration
    if (dns.length === 0) {
      delete payload.dns;
    }

    // Make the API call to update network configuration
    fetch("/api1/update-network", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Network updated successfully!");
          // Clear input fields and reset DHCP to default
          setIp("");
          setSubnet("");
          setGateway("");
          setDns("");
          setDhcpEnabled("DHCP");
          setSelectedInterface("");
          fetchNetworkInfo();
        } else {
          alert(`Error updating network: ${data.message}`);
        }
      })
      .catch((error) => console.error("Error updating network:", error));
  };

  const handleInterfaceSelect = (iface) => {
    setSelectedInterface(iface);

    // Check if the selected interface exists in the fetched network information
    const selected = networkInfo[iface];
    if (selected) {
      setIp(selected["IP Address"] ? selected["IP Address"].join(", ") : ""); // Set to empty string if no IP Address found
      setSubnet(
        selected["Subnet Mask"] ? selected["Subnet Mask"].join(", ") : ""
      ); // Set to empty string if no Subnet Mask found
      setGateway(selected["Gateway"] ? selected["Gateway"].join(", ") : ""); // Set to empty string if no Gateway found
      setDns(selected["DNS"] ? selected["DNS"].join(", ") : ""); // Convert DNS array to comma-separated string or set to empty
      setDhcpEnabled(selected["DHCP Status"] === "DHCP" ? "DHCP" : "Manual");
    } else {
      // Clear all fields if the interface has no data
      setIp("");
      setSubnet("");
      setGateway("");
      setDns("");
      setDhcpEnabled("DHCP");
    }
  };

  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-6 overflow-auto mt-4 justify-center">
        <div className="border border-gray-500 mb-2 p-6 bg-white rounded-lg shadow-lg">
          <div className="border border-gray-500 p-6 mb-4">
            <h3 className="text-3xl text-blue-600 font-bold">
              Available Interfaces
            </h3>
            <div className="flex items-center justify-between mt-4">
              <div className="font-bold flex-1">Interfaces</div>
              <div className="font-bold flex-1">Status</div>
              <div className="font-bold flex-1">Type</div>
              <div className="font-bold flex-1">IP Address</div>
              <div className="font-bold flex-1">Subnet</div>
              <div className="font-bold flex-1">Gateway</div>
              <div className="font-bold flex-1">DNS</div>
            </div>
            {Object.entries(networkInfo).map(([iface, info]) => (
              <div
                key={iface}
                className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded-lg"
              >
                <strong className="flex-1">{iface}</strong>
                <div className="flex-1">{info.Status}</div>
                <div className="flex-1">{info["DHCP Status"] || "N/A"}</div>
                <div className="flex-1">{info["IP Address"] || "No IP"}</div>
                <div className="flex-1">
                  {info.Status === "Up" ? info["Subnet Mask"] || "N/A" : "N/A"}
                </div>
                <div className="flex-1">
                  {info.Status === "Up" ? info["Gateway"] || "N/A" : "N/A"}
                </div>
                <div className="flex-1">
                  {info.Status === "Up" ? info["DNS"] || "N/A" : "N/A"}
                </div>
              </div>
            ))}
          </div>

          <div className="border border-gray-500 p-6 mt-4">
            <h2 className="text-3xl font-bold text-blue-600 mb-4">
              Network Configuration
            </h2>
            <div className="mb-4">
              <label>Select Interface:</label>
              <select
                onChange={(e) => handleInterfaceSelect(e.target.value)}
                value={selectedInterface}
                className="h-[1.5rem] w-[16rem] outline-none px-4 ml-2 border border-gray-300 rounded-md"
              >
                <option value="">-- Select Interface --</option>
                {Object.keys(networkInfo).map((iface) => (
                  <option key={iface} value={iface}>
                    {iface} ({networkInfo[iface].Status}) -{" "}
                    {networkInfo[iface]["IP Address"] || "No IP"}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label>Select Configuration:</label>
              <select
                onChange={(e) => setDhcpEnabled(e.target.value)}
                value={dhcpEnabled}
                className="h-[1.5rem] w-[16rem] outline-none px-4 ml-2 border border-gray-300 rounded-md"
              >
                <option value="DHCP">DHCP</option>
                <option value="Manual">Manual</option>
              </select>
            </div>

            {dhcpEnabled === "Manual" && (
              <>
                <div className="mb-4">
                  <label>IP Address: </label>
                  <input
                    type="text"
                    value={ip} // This will remain empty if no IP is available
                    onChange={(e) => setIp(e.target.value)}
                    placeholder="Enter IP Address"
                    className="h-[1.5rem] w-[15rem] bg-gray-200 outline-none px-4 ml-1 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label>Subnet Mask / CIDR: </label>
                  <input
                    type="text"
                    value={subnet} // This will remain empty if no subnet is available
                    onChange={(e) => setSubnet(e.target.value)}
                    placeholder="Enter Subnet Mask or CIDR"
                    className="h-[1.5rem] w-[15rem] bg-gray-200 outline-none px-4 ml-1 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label>Gateway: </label>
                  <input
                    type="text"
                    value={gateway} // This will remain empty if no gateway is available
                    onChange={(e) => setGateway(e.target.value)}
                    placeholder="Enter Gateway (optional)"
                    className="h-[1.5rem] w-[15rem] bg-gray-200 outline-none px-4 ml-1 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label>DNS (comma separated): </label>
                  <input
                    type="text"
                    value={dns} // This will remain empty if no DNS is available
                    onChange={(e) => setDns(e.target.value)}
                    placeholder="Enter DNS (optional)"
                    className="h-[1.5rem] w-[15rem] bg-gray-200 outline-none px-4 ml-1 border border-gray-300 rounded-md"
                  />
                </div>
              </>
            )}

            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white p-2 rounded-md mt-4"
            >
              Update Network Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NetworkConfiguration;
