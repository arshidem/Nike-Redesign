import React, { useState, lazy, Suspense } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import "../../../css/home.css";
import { useAppContext } from '../../../context/AppContext.jsx';
import Footer from '../components/Footer.jsx';

const Featured = lazy(() => import('../components/Featured.jsx'));
const ShopByIcons = lazy(() => import('../components/ShopByIcons.jsx'));

function Home() {
  const { token, user } = useAppContext();
  const whiteBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGAAAAAEAAHI3f8WAAAAAElFTkSuQmCC";
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div>
      <Navbar />

      <div className="homepage">
        <div className={`home-image ${!imageLoaded ? "loading" : ""}`}>
       <picture>
  <source
    media="(max-width: 480px)"
    srcSet="/assets/home/mobileImg1.jpg"
    type="image/webp"
  />
  <source
    media="(max-width: 768px)"
    srcSet="/assets/home/tabletImg.webp"
    type="image/webp"
  />
  <img
    src="/assets/home/desktopImg.webp"
    alt="Nike Shoe"
    onLoad={() => setImageLoaded(true)}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = whiteBase64;
      setImageLoaded(true);
    }}
    loading="eager" // ✅ Preloads immediately (homepage banner)
    width="100%"
    height="auto"
  />
</picture>

        </div>

        <div className="second">
          <h1>ELEVATE YOUR LOOK</h1>
          <p>Be ready for anything with the season's newest styles</p>
          <button>Shop Sandals</button>
        </div>

        <Suspense fallback={<div>Loading featured...</div>}>
          <Featured />
        </Suspense>

        <Suspense fallback={<div>Loading icons...</div>}>
          <ShopByIcons />
        </Suspense>
      </div>
      <Footer/>
    </div>
  );
}

export default Home;
