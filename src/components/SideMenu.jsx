import React, { useState } from "react";
import { BsFillArrowLeftCircleFill } from "react-icons/bs";
import { MdOutlineDashboard, MdOutlineSettings } from "react-icons/md";
import { FaTableCells } from "react-icons/fa6";
import { FaHome } from "react-icons/fa";
import { Link } from "react-router-dom";

function SideMenu({ children }) {
  const [open, setOpen] = useState(false);
  const [activeMenus, setActiveMenus] = useState([]);

  const menus = [
    { name: "Home", icon: FaHome, link: "/home" },
    {
      name: "Dashboard",
      icon: MdOutlineDashboard,
      subItems: [
        { name: "Dashboard 1", link: "/dashboard-1" },
        { name: "Dashboard 2", link: "/dashboard-2" },
        { name: "Dashboard 3", link: "/dashboard-3" },
      ],
    },
    { name: "ARP Table", icon: FaTableCells, link: "/arp" },
    {
      name: "Settings",
      icon: MdOutlineSettings,
      subItems: [
        { name: "Network Configuration", link: "/network-configuration" },
        { name: "Add Static ARP", link:"/add-arp"},
        { name: "Delete ARP", link:"/delete-arp"},
      ],
    },
  ];

  const handleMenuClick = (menuIndex) => {
    if (!open) {
      toggleMenu();
    }
    if (menus[menuIndex].subItems) {
      setActiveMenus((prev) =>
        prev.includes(menuIndex) ? prev.filter((index) => index !== menuIndex) : [...prev, menuIndex]
      );
    }
  };

  const toggleMenu = () => {
    setOpen((prev) => {
      if (prev) {
        setActiveMenus([]);
      }
      return !prev;
    });
  };

  return (
    <div className={`${open ? "w-72" : "w-20"} duration-300 h-screen bg-gray-300 p-5`}>
      <div className="py-2 flex justify-end">
        <BsFillArrowLeftCircleFill size={30} className={`cursor-pointer ${!open && 'rotate-180'}`} onClick={toggleMenu} />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {menus.map((menu, i) => (
          <div key={i}>
            <Link to={menu.link || "#"} onClick={() => handleMenuClick(i)}>
              <div
                className="group flex items-center gap-3.5 font-bold p-2 hover:bg-gray-400 rounded-md cursor-pointer"
              >
                <div>{React.createElement(menu.icon, { size: "20" })}</div>
                <h2 className={`whitespace-pre duration-500 ${!open && "opacity-0"}`}>{menu.name}</h2>
                <h2
                  className={`${
                    open && "hidden"
                  } absolute left-48 bg-gray-600 font-semibold whitespace-pre text-white
                  rounded-md drop-shadow-lg px-0 w-0 overflow-hidden group-hover:px-2
                  group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit`}
                >
                  {menu.name}
                </h2>
              </div>
            </Link>
            {activeMenus.includes(i) &&
              open &&
              menu.subItems &&
              menu.subItems.map((subItem, idx) => (
                <Link
                  key={idx}
                  to={subItem.link}
                  className="flex items-center gap-3.5 pl-12 font-bold p-2 hover:bg-gray-400 rounded-md"
                >
                  {subItem.name}
                </Link>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SideMenu;
