import React, { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
import "../../../css/home.css";

const ShopByIcons = lazy(() => import("../components/ShopByIcons"));
const categories = [
  { title: "New Arrivals", to: "/products?newArrival=true", image: "/assets/editorial/dunk.png" },
  { title: "Best Sellers", to: "/products?bestSellers=true", image: "/assets/editorial/blazer-low.svg" },
  { title: "Men", to: "/products?gender=men&category=shoes", image: "/assets/editorial/air.png" },
  { title: "Women", to: "/products?gender=women&category=shoes", image: "/assets/editorial/blazer-mid.svg" },
];

// These campaign picks link to existing products in the store catalog.
const campaignPicks = [
  { name: "Nike Dunk Low Retro", slug: "nike-dunk-low-retro-men", image: "/assets/editorial/dunk.png" },
  { name: "Nike Blazer Mid ’77", slug: "nike-blazer-mid-77-vintage-men", image: "/assets/editorial/blazer-mid.svg" },
  { name: "Nike Blazer Low Platform", slug: "nike-blazer-low-platform-women", image: "/assets/editorial/blazer-low.svg" },
];

export default function Home() {
  return (
    <div className="storefront">
      <Navbar />
      <main id="main-content" className="store-home">
        <section className="campaign-hero" aria-labelledby="campaign-title">
          <div className="campaign-copy">
            <p className="store-eyebrow">
              <span className="status-dot" /> EVERYDAY ICONS / VOL. 01
            </p>
            <h1 id="campaign-title">
              <span>MAKE</span>
              <span>YOUR</span>
              <span className="campaign-accent">MOVE.</span>
            </h1>
            <p className="campaign-description">
              Court roots. Street attitude. Find the pair that takes you from
              your first step to your next big thing.
            </p>
            <Link className="store-button" to="/products?newArrival=true">
              Explore new arrivals <ArrowUpRightIcon />
            </Link>
            <div className="campaign-footnote">
              <span>DESIGNED FOR MOTION</span>
              <span>WORN YOUR WAY ↗</span>
            </div>
          </div>
          <div className="campaign-art">
            <span className="campaign-outline" aria-hidden="true">
              DUNK
            </span>
            <div className="campaign-orbit" aria-hidden="true" />
            <img
              className="hero-shoe"
              src="/assets/editorial/dunk.png"
              alt="Black and white Nike Dunk Low, side profile"
              width="1000"
              height="500"
              fetchPriority="high"
            />
            <div className="art-index" aria-hidden="true">
              <span>DUNK / LOW</span>
              <div className="campaign-pagination"><span>01</span><i /><i /><i /></div>
            </div>
            <Link
              to="/product/nike-dunk-low-retro-men"
              className="hero-product"
            >
              <span>
                <small>THE EVERYDAY ORIGINAL</small>
                <strong>Nike Dunk</strong>
              </span>
              <span className="round-arrow">
                <ArrowUpRightIcon />
              </span>
            </Link>
          </div>
        </section>

        <div className="movement-strip" aria-hidden="true">
          <span>NO FINISH LINE.</span>
          <span>✳</span>
          <span>JUST YOUR NEXT MOVE.</span>
          <span>✳</span>
          <span>BUILT FOR MORE.</span>
        </div>

        <nav className="home-categories" aria-label="Shop collections">
          {categories.map((category) => (
            <Link className="home-category" key={category.title} to={category.to}>
              <span className="home-category-image">
                <img src={category.image} alt="" width="220" height="220" loading="lazy" />
              </span>
              <span>{category.title}</span>
            </Link>
          ))}
        </nav>

        <section className="sport-story" aria-labelledby="story-title">
          <img
            className="sport-story-image"
            src="/assets/editorial/concrete-steps.svg"
            alt="Black and white Dunk sneakers styled with taupe trousers on concrete steps"
            width="1942"
            height="809"
            loading="lazy"
          />
          <div className="sport-story-copy">
            <p className="store-eyebrow">MORE THAN A LOOK</p>
            <h2 id="story-title">
              <span>Different</span>
              <span>games.</span>
              <span>Same energy.</span>
            </h2>
            <Link
              className="store-button store-button-light"
              to="/products?isTrending=true"
            >
              Find your inspiration <ArrowUpRightIcon />
            </Link>
          </div>
        </section>

        <section className="store-section home-edit" aria-labelledby="home-edit-title">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">IN THE ROTATION</p>
              <h2 id="home-edit-title">Your next obsession.</h2>
            </div>
            <Link className="store-text-link" to="/products?bestSellers=true">
              Explore the edit <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="home-edit-grid">
            {campaignPicks.map((product) => (
              <Link className="home-edit-card" key={product.slug} to={`/product/${product.slug}`}>
                <div className="home-edit-image">
                  <img src={product.image} alt={product.name} width="500" height="350" loading="lazy" />
                </div>
                <div className="home-edit-caption">
                  <div><h3>{product.name}</h3><p>Footwear &amp; apparel</p></div>
                  <ArrowUpRightIcon />
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="store-section">
          <Suspense fallback={<p role="status">Loading icons…</p>}>
            <ShopByIcons />
          </Suspense>
        </div>
        <section className="membership-panel">
          <div>
            <p className="store-eyebrow">YOUR NEXT CHAPTER</p>
            <h2>
              EVERY MOVE
              <br />
              STARTS WITH YOU.
            </h2>
          </div>
          <div>
            <p>
              Keep your favourites close, track your orders, and find what moves
              you.
            </p>
            <Link to="/signin" className="store-button">
              Join the community <ArrowUpRightIcon />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
