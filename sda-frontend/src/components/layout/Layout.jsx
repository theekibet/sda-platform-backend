// src/components/layout/Layout.jsx
import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';

const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-5 pt-14 md:pt-16 bg-gray-50">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;