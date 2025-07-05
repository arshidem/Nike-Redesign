import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FastAverageColor } from "fast-average-color";
import { ArrowIconLeft, ArrowIconRight } from "../../../shared/ui/Icons";
import "../../../css/featured.css";

export default function Featured() {
  const [shoes, setShoes] = useState([]);
  const [index, setIndex] = useState(0);
  const [animationType, setAnimationType] = useState("enter");
  const [bgColor, setBgColor] = useState("#ffffff");
  const imgRef = useRef(null);

 useEffect(() => {
  fetch("/data.json")
    .then((res) => res.json())
    .then((data) => setShoes(data.featuredShoe))
    .catch((err) => console.error("Failed to fetch shoe data:", err));
}, []);


  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      extractColor();
    }
  }, [index, shoes]);

  const onImageLoad = () => {
    extractColor();
  };

  const hexToRgba = (hex, alpha = 0.3) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const extractColor = () => {
    try {
      const fac = new FastAverageColor();
      const color = fac.getColor(imgRef.current);
      const rgbaColor = hexToRgba(color.hex, 0.25);
      setBgColor(rgbaColor);
    } catch (error) {
      console.error("Error extracting color:", error);
      setBgColor("#ffffff");
    }
  };

  const changeIndex = (direction) => {
    setAnimationType("exit");

    setTimeout(() => {
      setIndex((prev) => {
        if (direction === "next") return (prev + 1) % shoes.length;
        else return (prev - 1 + shoes.length) % shoes.length;
      });
      setAnimationType("enter");
    }, 600);
  };

  if (shoes.length === 0) return <div>Loading...</div>;

  const { name, image } = shoes[index];
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div>
      <h1 className="featured-title">Featured</h1>

      <div className="featured-container " style={{ backgroundColor: bgColor }}>
        <div className="shoe-card">
          <div
            className={`text-side ${
              animationType === "enter"
                ? "animate-text"
                : animationType === "exit"
                ? "animate-text-exit"
                : ""
            }`}
          >
            <h2 className="shoe-name">{name}</h2>
            <Link to={`/product/${slug}`} className="view-button">
              View Details
            </Link>
          </div>

          <div className="image-side">
            <div
              className={`image-wrapper ${
                animationType === "enter"
                  ? "animate-image"
                  : animationType === "exit"
                  ? "animate-exit"
                  : ""
              }`}
            >
              <img
                src={image}
                alt={name}
                ref={imgRef}
                crossOrigin="anonymous"
                onLoad={onImageLoad}
                className="shoe-img"
              />
              <div className="oval-shadow"></div>
            </div>
          </div>
<div className="big-nike-text-container">
  <div className="big-nike-text">NIKE</div>
  <div className="big-nike-text mirrored">NIKE</div>
</div>

        </div>

        <div className="nav-buttons">
          <button className="p-2 bg-transparent  rounded-full shadow-md hover:bg-gray-50 transition" onClick={() => changeIndex("prev")}>
            <ArrowIconLeft />
          </button>
          <button className="p-2   rounded-full shadow-md hover:bg-gray-100 transition" onClick={() => changeIndex("next")}>
            <ArrowIconRight />
          </button>
        </div>
      </div>
    </div>
  );
}


