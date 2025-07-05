import React, { useEffect, useState,useContext } from 'react';
import { Navbar } from '../components/Navbar.jsx';
import "../../../css/home.css";
import Featured from '../components/Featured.jsx';
import ShopByIcons from '../components/ShopByIcons.jsx';
import { useAppContext } from '../../../context/AppContext.jsx';

function Home() {
    const { token,user } = useAppContext();

  const whiteBase64 =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGAAAAAEAAHI3f8WAAAAAElFTkSuQmCC";
    
  const [imageLoaded, setImageLoaded] = useState(false);
// console.log(user);


  return (
    <div>
      <Navbar />
      
      <div className="homepage">

        <div className={`home-image ${!imageLoaded ? "loading" : ""}`}>
          <picture>
            <source media="(max-width: 480px )" srcSet="/assets/home/mobileImg1.jpg" />
            <source media="(max-width: 768px )" srcSet="/assets/home/tabletImg.jpg" />
            <img
              src="/assets/home/desktopImg.jpg"
              alt="Nike Shoe"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = whiteBase64;
                setImageLoaded(true);
              }}
            />
          </picture>
        </div>

        <div className='second'>
          <h1>ELEVATE YOUR LOOK</h1>
          <p>Be ready for anything with the season's newest styles</p>
          <button>Shop Sandals</button>
        </div>

        <Featured />
        <ShopByIcons/>
      </div>
    </div>
  );
}

export default Home;
