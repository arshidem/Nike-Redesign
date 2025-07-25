import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FastAverageColor } from "fast-average-color";
import { ArrowIconLeft, ArrowIconRight } from "../../../shared/ui/Icons";
import { useProductService } from "../../product/services/productService";
import "../../../css/featured.css";
import { useAppContext } from "../../../context/AppContext";
import { FeaturedSkeleton } from "../../../shared/ui/Skeleton";

export default function Featured() {
  const [shoes, setShoes] = useState([]);
  const [error, setError] = useState("");
  const [index, setIndex] = useState(0);
  const [animationType, setAnimationType] = useState("enter");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [preloadedImages, setPreloadedImages] = useState({}); // Stores preloaded images
  const imgRef = useRef(null);
  const { backendUrl } = useAppContext();

  const { fetchFeaturedProducts } = useProductService();

  const formatImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== "string") return "/placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;

    const match = imagePath.match(/uploads[\\/][\w\-.]+\.(jpg|jpeg|avif|png|webp)/i);
    const relativePath = match ? match[0].replace(/\\/g, "/") : imagePath;

    return backendUrl ? `${backendUrl}/${relativePath}` : `/${relativePath}`;
  };

  // Preload all images when shoes data is fetched
  useEffect(() => {
    if (shoes.length > 0) {
      const preloadImages = {};
      shoes.forEach((shoe) => {
        const img = new Image();
        img.src = formatImageUrl(shoe.featuredImg);
        preloadImages[shoe.slug] = img; // Store in object for quick access
      });
      setPreloadedImages(preloadImages);
    }
  }, [shoes]);

  useEffect(() => {
    fetchFeaturedProducts()
      .then((data) => {
        if (Array.isArray(data)) {
          setShoes(data);
          setError("");
        } else {
          setError("Unexpected response format");
        }
      })
      .catch((err) => {
        console.error("Failed to fetch featured shoes:", err);
        setError("Something went wrong while fetching featured shoes.");
      });
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
      const img = imgRef.current;
      if (!img || !img.complete || img.naturalWidth === 0 || img.src.includes("placeholder.jpg")) {
        return;
      }
      const fac = new FastAverageColor();
      const color = fac.getColor(img);
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

  if (!error && shoes.length === 0) {
    return <FeaturedSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{error}</div>;
  }

  const currentShoe = shoes[index] || {};

  return (
    <div>
      <h1 className="featured-title">Featured</h1>

      <div className="featured-container" style={{ backgroundColor: bgColor }}>
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
            <h2 className="shoe-name">{currentShoe.name}</h2>
            <Link to={`/product/${currentShoe.slug}`} className="view-button">
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
                src={formatImageUrl(currentShoe.featuredImg)}
                alt={currentShoe.name}
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
          <button
            className="p-2 bg-transparent rounded-full shadow-md hover:bg-gray-50 transition"
            onClick={() => changeIndex("prev")}
          >
            <ArrowIconLeft />
          </button>
          <button
            className="p-2 rounded-full shadow-md hover:bg-gray-100 transition"
            onClick={() => changeIndex("next")}
          >
            <ArrowIconRight />
          </button>
        </div>
      </div>

      {/* Hidden preloaded images (ensures they're cached) */}
      <div style={{ display: "none" }}>
        {shoes.map((shoe) => (
          <img
            key={shoe.slug}
            src={formatImageUrl(shoe.featuredImg)}
            alt={`Preloaded ${shoe.name}`}
            crossOrigin="anonymous"
          />
        ))}
      </div>
    </div>
  );
}