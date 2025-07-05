import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowIconRight, ArrowIconLeft } from "../../../shared/ui/Icons";

import AccountDetails from "./AccountDetails";
import DeliveryAddresses from "./DeliveryAddresses";

const sections = [
  { key: "account", label: "Account Details" },
  { key: "addresses", label: "Delivery Addresses" },
];

const AccountSettings = () => {
  const [activeTab, setActiveTab] = useState("account");
  const [showMobileView, setShowMobileView] = useState(false);
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case "account":
        return <AccountDetails />;
      case "addresses":
        return <DeliveryAddresses />;
      default:
        return <AccountDetails />;
    }
  };

  const handleBackClick = () => {
    if (window.innerWidth < 768 && showMobileView) {
      setShowMobileView(false);
    } else {
      navigate("/home"); // 🔁 change to your desired route
    }
  };

  return (
    <div className="p-4">
      {/* Top back button for all screens */}
      <div className="flex items-center mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center text-gray-600 hover:text-black transition-colors"
        >
          <ArrowIconLeft className="w-5 h-5" />
          <span className="ml-2 text-sm font-medium">Back</span>
        </button>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex gap-8">
        <aside className="w-1/4 border-r pr-4">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          <ul className="space-y-4">
            {sections.map((section) => (
              <li
                key={section.key}
                onClick={() => setActiveTab(section.key)}
                className={`cursor-pointer flex items-center justify-between px-2 py-2 rounded-md font-medium transition-all duration-200 ${
                  activeTab === section.key
                    ? "bg-black text-white"
                    : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                {section.label}
                <ArrowIconRight />
              </li>
            ))}
          </ul>
        </aside>
        <main className="flex-1">{renderContent()}</main>
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {showMobileView ? (
          <div>{renderContent()}</div>
        ) : (
          <>
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <ul className="space-y-4">
              {sections.map((section) => (
                <li
                  key={section.key}
                  onClick={() => {
                    setActiveTab(section.key);
                    setShowMobileView(true);
                  }}
                  className="cursor-pointer flex justify-between items-center px-3 py-3 border rounded-md"
                >
                  {section.label}
                  <ArrowIconRight />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
