import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LogoLoader() {
  const [isImageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const img = new Image();
    img.src = '/assets/logo/nikeOverlay.png';
    img.onload = () => {
      setImageLoaded(true);
    };
  }, []);

  // Navigate to /home after 4s
  useEffect(() => {
    if (isImageLoaded) {
      const timer = setTimeout(() => {
        navigate('/home');
      }, 4000); // 4 seconds delay

      return () => clearTimeout(timer);
    }
  }, [isImageLoaded, navigate]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      {isImageLoaded && (
        <div className="w-[1100px] h-[1100px] sm:w-[1100px] md:w-[1200px] lg:w-[1500px] xl:w-[1500px] 2xl:w-[1000px] aspect-[1/1] logo">
          <img
            src="/assets/logo/nikeOverlay.png"
            alt="Nike logo"
            className="w-full h-full object-contain"
          />
          <div className="absolute w-64 h-64 z-20 pointer-events-none shimmer-overlay"></div>
        </div>
      )}
    </div>
  );
}
