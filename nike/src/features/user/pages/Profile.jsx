// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Toaster } from "react-hot-toast";
import axios from "axios";
import Footer from "../components/Footer";
import { BackBar } from "../../../shared/ui/Icons";

const INTEREST_CATEGORIES = ["Sports", "Products", "Teams", "Athletes", "Cities"];

const Profile = () => {
  const { user, token, backendUrl } = useAppContext();
  const [activeTab, setActiveTab] = useState("All");
  const [interests, setInterests] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?._id) fetchInterests();
  }, [user]);

  const fetchInterests = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/interests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInterests(res.data);
    } catch (err) {
      console.error("Failed to load interests", err);
    } finally {
      setLoading(false);
    }
  };

  const renderInterestCards = () => {
    if (activeTab === "All") {
      return INTEREST_CATEGORIES.map((category) => (
        <InterestCard key={category} title={category} items={interests[category.toLowerCase()] || []} />
      ));
    }
    return (
      <InterestCard
        title={activeTab}
        items={interests[activeTab.toLowerCase()] || []}
      />
    );
  };

  const InterestCard = ({ title, items }) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {items.length === 0 ? (
        <div className="border border-dashed rounded-lg p-4 text-center text-gray-500 bg-gray-50">
          <div className="text-3xl mb-2">+</div>
          <div>Add {title}</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span key={i} className="bg-black text-white px-3 py-1 rounded-full text-sm">
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BackBar/>
      <Toaster />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 mt-10">
        <div className="w-20 h-20 rounded-full bg-gray-300" />
        <div>
          <h1 className="text-2xl font-semibold">{user?.name}</h1>
          <p className="text-sm text-gray-600">Nike Member Since {new Date(user?.createdAt).toLocaleString("default", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="border-b mb-4">
        <div className="flex gap-6 text-sm font-medium">
          {["All", ...INTEREST_CATEGORIES].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 border-b-2 transition-all duration-200 ${
                activeTab === tab ? "border-black text-black" : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p>Loading interests...</p> : renderInterestCards()}
      <Footer/>
    </div>
  );
};

export default Profile;
