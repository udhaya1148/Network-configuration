import SideMenu from "./SideMenu"


function MainDashboard() {
  return (
    <div className="flex flex-row h-screen w-screen">
      <SideMenu />
      <div className="flex-grow p-1 overflow-auto  justify-center">
         <iframe
          src="http://localhost:3000"
          
          frameBorder="0"
          title="Dashboard"
          className="w-full h-full"
        ></iframe>
    </div>
    </div>
  )
}

export default MainDashboard
