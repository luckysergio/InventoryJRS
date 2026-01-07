// components/Layout.jsx
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
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* MAIN AREA */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* NAVBAR */}
        <Navbar
          setSidebarOpen={setSidebarOpen}
          centerContent={navbarContent}
        />

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {typeof children === "function"
            ? children({ setNavbarContent })
            : children}
        </main>

        {/* FOOTER */}
        <Footer />
      </div>
    </div>
  );
};

export default Layout;