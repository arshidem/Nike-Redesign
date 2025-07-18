import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAppContext } from '../../context/AppContext';

const {backendUrl} = useAppContext();
const AdminLayout = ({ children }) => {
  useEffect(() => {
    const socket = io(backendUrl); // or your deployed backend

    socket.on('new-order', (data) => {
      console.log('🔔 New order received:', data);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification("🛒 New Order", {
          body: `From ${data.user}, Total: ₹${data.totalAmount}`,
        });
      }
    });

    // Ask for notification permission once
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    return () => socket.disconnect(); // Clean up on unmount
  }, []);

  return (
    <div>
      {/* Your Admin Header / Sidebar / etc */}
      {children}
    </div>
  );
};

export default AdminLayout;
