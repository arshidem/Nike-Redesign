import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
const groups = [
  {
    title: "Find your next",
    links: [
      ["New arrivals", "/products?newArrival=true"],
      ["Best sellers", "/products?bestSellers=true"],
      ["Men", "/products?gender=men&category=shoes"],
      ["Women", "/products?gender=women&category=shoes"],
      ["Kids", "/products?gender=kids&category=shoes"],
    ],
  },
  {
    title: "Your space",
    links: [
      ["Sign in", "/signin"],
      ["Your favourites", "/wishlist"],
      ["Shopping bag", "/bag"],
      ["Track your orders", "/orders"],
      ["Account settings", "/account"],
    ],
  },
];
export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="footer-top">
        <div className="footer-statement">
          NEVER
          <br />
          DONE.<span>↗</span>
        </div>
        {groups.map((group) => (
          <div className="footer-links" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, to]) => (
              <Link to={to} key={to}>
                {label}
                <ArrowUpRightIcon />
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <span>NIKE / INDEPENDENT STOREFRONT CONCEPT</span>
        <span>Designed by Triode Studio · India</span>
        <span>Not affiliated with Nike, Inc.</span>
      </div>
    </footer>
  );
}
