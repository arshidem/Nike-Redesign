import React from "react";
import { NikeSwoosh } from "../../../shared/ui/Icons"; // Adjust the path if needed

const Footer = () => {
  return (
    <footer className="bg-white border-t pt-10 pb-6 text-sm text-gray-700">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Top Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <div>
            <h4 className="font-semibold mb-3">Resources</h4>
            <ul className="space-y-2">
              <li>Find A Store</li>
              <li>Become A Member</li>
              <li>Running Shoe Finder</li>
              <li>Product Advice</li>
              <li>Send Us Feedback</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Help</h4>
            <ul className="space-y-2">
              <li>Get Help</li>
              <li>Order Status</li>
              <li>Delivery</li>
              <li>Returns</li>
              <li>Payment Options</li>
              <li>Contact Us On Nike.com Inquiries</li>
              <li>Contact Us On All Other Inquiries</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Company</h4>
            <ul className="space-y-2">
              <li>About Nike</li>
              <li>News</li>
              <li>Careers</li>
              <li>Investors</li>
              <li>Sustainability</li>
              <li>Impact</li>
              <li>Report a Concern</li>
            </ul>
          </div>

          <div className="flex justify-start lg:justify-end items-start mt-1">
            <div className="flex items-center gap-1">
              <span className="text-xl">🌐</span>
              <span>India</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 gap-4">
          <div className="flex items-center gap-2">
            <NikeSwoosh className="w-5 h-5" />
            <span>© 2025 Nike, Inc. All rights reserved</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center md:justify-start">
            <span>Guides ⌄</span>
            <span>Terms of Sale</span>
            <span>Terms of Use</span>
            <span>Nike Privacy Policy</span>
            <span>Privacy Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
