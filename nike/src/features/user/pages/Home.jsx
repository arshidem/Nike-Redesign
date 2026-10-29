import React, { lazy, Suspense } from "react";
import { Link } from "../../../lib/navigation";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { Navbar } from "../components/Navbar";
import Footer from "../components/Footer";
const Featured = lazy(() => import("../components/Featured"));
const ShopByIcons = lazy(() => import("../components/ShopByIcons"));
const departments = [
  {
    number: "01",
    title: "Men",
    caption: "Built for your everyday.",
    to: "/men/shoes?gender=men&category=shoes",
    image: "/assets/editorial/dunk.png",
  },
  {
    number: "02",
    title: "Women",
    caption: "Make your own moves.",
    to: "/women/shoes?gender=women&category=shoes",
    image: "/assets/editorial/air.png",
  },
  {
    number: "03",
    title: "Kids",
    caption: "Big energy. Small sizes.",
    to: "/kids/shoes?gender=kids&category=shoes",
    image: "/assets/editorial/classic.png",
  },
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
            <Link className="store-button" to="/new/arrivals?newArrival=true">
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
            <span className="art-index" aria-hidden="true">
              DUNK / LOW
            </span>
            <Link
              to="/men/shoes?gender=men&category=shoes"
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
          <span>NO FINISH LINE.</span>
        </div>

        <section className="store-section" aria-labelledby="shop-title">
          <div className="store-section-heading">
            <div>
              <p className="store-eyebrow">FIND YOUR FIT</p>
              <h2 id="shop-title">A little more you.</h2>
            </div>
            <Link
              className="store-text-link"
              to="/new/arrivals?newArrival=true"
            >
              Shop the collection <ArrowUpRightIcon />
            </Link>
          </div>
          <div className="department-grid">
            {departments.map((department) => (
              <Link
                className="department-card"
                key={department.title}
                to={department.to}
              >
                <div className="department-top">
                  <span>{department.number} / THE COLLECTION</span>
                  <ArrowUpRightIcon />
                </div>
                <img
                  src={department.image}
                  alt=""
                  loading="lazy"
                  width="1000"
                  height="500"
                />
                <div className="department-bottom">
                  <div>
                    <h3>{department.title}</h3>
                    <p>{department.caption}</p>
                  </div>
                  <span className="round-arrow">
                    <ArrowUpRightIcon />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <Suspense
          fallback={
            <div className="store-section" role="status">
              Loading the latest collection…
            </div>
          }
        >
          <Featured />
        </Suspense>

        <section className="sport-story" aria-labelledby="story-title">
          <picture>
            <source
              media="(max-width: 600px)"
              srcSet="/assets/home/mobileImg1.jpg"
            />
            <img
              src="/assets/home/desktopImg.webp"
              alt="Athletes bringing their own style to basketball and skateboarding"
              loading="lazy"
            />
          </picture>
          <div className="sport-story-copy">
            <p className="store-eyebrow">MORE THAN A LOOK</p>
            <h2 id="story-title">
              Different games.
              <br />
              Same energy.
            </h2>
            <Link
              className="store-button store-button-light"
              to="/new/trending?isTrending=true"
            >
              Find your inspiration <ArrowUpRightIcon />
            </Link>
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
