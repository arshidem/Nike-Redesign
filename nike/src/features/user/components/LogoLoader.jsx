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

  useEffect(() => {
    if (isImageLoaded) {
      const timer = setTimeout(() => {
        navigate('/home');
      }, 3000); // after logo animation
      return () => clearTimeout(timer);
    }
  }, [isImageLoaded, navigate]);

  if (!isImageLoaded) return null; // ⛔ show nothing while loading

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div className="w-[1100px] h-[1100px] sm:w-[1100px] md:w-[1200px] lg:w-[1500px] xl:w-[1500px] 2xl:w-[1000px] aspect-[1/1] logo">
        <img
          src="/assets/logo/nikeOverlay.png"
          alt="Nike logo"
          className="w-full h-full object-contain"
        />
        <div className="absolute w-64 h-64 z-20 pointer-events-none shimmer-overlay"></div>
      </div>
    </div>
  );
}
