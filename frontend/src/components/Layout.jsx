import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navbarContent, setNavbarContent] = useState(null);
  const location = useLocation();

  useEffect(() => {
    setNavbarContent(null);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-col flex-1 min-w-0">
        <Navbar setSidebarOpen={setSidebarOpen} centerContent={navbarContent} />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-7xl mx-auto w-full">
            {typeof children === "function"
              ? children({ setNavbarContent })
              : children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default Layout;