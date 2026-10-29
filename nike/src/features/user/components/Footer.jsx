import React from "react";
import { Link } from "../../../lib/navigation";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
const groups = [
  {
    title: "Find your next",
    links: [
      ["New arrivals", "/new/arrivals?newArrival=true"],
      ["Best sellers", "/new/best-sellers?bestSellers=true"],
      ["Men", "/men/shoes?gender=men&category=shoes"],
      ["Women", "/women/shoes?gender=women&category=shoes"],
      ["Kids", "/kids/shoes?gender=kids&category=shoes"],
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
        <nav className="footer-legal-links" aria-label="Legal"><Link to="/privacy-policy">Privacy Policy</Link><Link to="/terms-of-service">Terms of Service</Link></nav>
      </div>
    </footer>
  );
}
