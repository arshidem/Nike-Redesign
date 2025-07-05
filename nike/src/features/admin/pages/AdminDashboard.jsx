import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AllProducts } from '../components/AllProducts';
import { AllOrders } from '../components/AllOrders';
import { AllUsers } from '../components/AllUsers';
import { Dashboard } from '../components/Dashboard';
import { Reports } from '../components/Reports';
import { HomeIcon,DashboardIcon, ProductsIcon, OrdersIcon, UsersIcon, ReportsIcon,NikeSwoosh, CouponIcon } from '../../../shared/ui/Icons';
import Coupon from '../components/Coupon';

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const navigate = useNavigate();

useEffect(() => {
  const handleHashChange = () => {
    const hash = window.location.hash.substring(1);
    if (hash && menuItems.some(item => item.id === hash)) {
      setActiveView(hash);
    }
  };

  handleHashChange(); // Run once on mount
  window.addEventListener('hashchange', handleHashChange);

  return () => window.removeEventListener('hashchange', handleHashChange);
}, []);


  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarCollapsed(true); // Default to collapsed on desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

const renderContent = () => {
  switch (activeView) {
    case 'products':
      return <AllProducts navigate={navigate} setActiveView={setActiveView} />;
    case 'orders':
      return <AllOrders navigate={navigate} setActiveView={setActiveView} />;
    case 'users':
      return <AllUsers navigate={navigate} setActiveView={setActiveView} />;
    case 'reports':
      return <Reports navigate={navigate} setActiveView={setActiveView} />;
    case 'dashboard':
      return <Dashboard navigate={navigate} setActiveView={setActiveView} />;
    case 'coupon':
      return <Coupon navigate={navigate} setActiveView={setActiveView} />;
    default:
      return <Dashboard navigate={navigate} setActiveView={setActiveView} />;
  }
};


  // Custom SVG Icons


  const menuItems = [
    { id: 'dashboard', icon: <DashboardIcon/>, label: 'Dashboard' },
    { id: 'products', icon: <ProductsIcon/>, label: 'Products' },
    { id: 'orders', icon: <OrdersIcon/>, label: 'Orders' },
    { id: 'users', icon: <UsersIcon/>, label: 'Users' },
    { id: 'reports', icon: <ReportsIcon/>, label: 'Reports' },
    { id: 'coupon', icon: <CouponIcon/>, label: 'Coupon' }
  ];

  const handleMenuItemClick = (id) => {
    setActiveView(id);
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  };

  const handleSidebarHover = (isHovering) => {
    if (!isMobile) {
      setSidebarCollapsed(!isHovering);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-50">
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white shadow-md lg:hidden"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>

        </button>
        
      )}

      {/* Sidebar */}
     <aside
  className={`fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
    ${sidebarCollapsed ? 'w-16' : 'w-64'} ${isMobile && !sidebarCollapsed ? 'shadow-lg' : ''}`}
  onMouseEnter={() => handleSidebarHover(true)}
  onMouseLeave={() => handleSidebarHover(false)}
>
  <div className="flex flex-col h-full justify-between">
    {/* Top Section */}
    <div>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className={`flex justify-between gap-5 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          <span>{<NikeSwoosh />}</span>
          <span className='text-xl font-bold text-black'>Admin Panel</span>
        </h2>
        {sidebarCollapsed && <NikeSwoosh />}
      </div>

      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems
            .filter(item => item.id !== 'home') // Exclude 'home' here
            .map((item) => (
              <li key={item.id} className="relative">
                <button
                  onClick={() => handleMenuItemClick(item.id)}
                  className={`flex items-center w-full px-3 py-3 rounded-lg transition-colors group relative ${
                    activeView === item.id
                      ? 'bg-gray-300'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>{item.label}</span>
                  <span
                    className={`absolute left-14 ml-2 bg-black text-white text-xs px-2 py-1 rounded shadow 
                      opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 ${
                        sidebarCollapsed ? 'group-hover:block' : 'hidden'
                      }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </nav>
    </div>

    {/* Bottom Section (Home Button) */}
    <div className="p-2 border-t border-gray-100">
  <div className="relative group">
    <button
      onClick={() => navigate('/home')}
      className="flex items-center w-full px-3 py-3 rounded-lg hover:bg-gray-200 text-gray-700"
    >
      <span className="flex-shrink-0">{<HomeIcon />}</span>
      <span className={`ml-3 ${sidebarCollapsed ? 'hidden' : 'block'}`}>Home</span>
    </button>

    {/* Tooltip for collapsed sidebar */}
    <span
      className={`absolute left-14 ml-2 bottom-2 bg-black text-white text-xs px-2 py-1 rounded shadow 
      opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 ${
        sidebarCollapsed ? 'group-hover:block' : 'hidden'
      }`}
    >
      Return to Home
    </span>
  </div>
</div>

  </div>
</aside>


      {/* Main content */}
      <main className={`relative h-full min-h-screen transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'pl-16' : 'pl-64'
      }`}>
        <div className="max-w-8xl mx-auto p-0">
          {renderContent()}
         
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;