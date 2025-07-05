// shared/ui/Loader.jsx
import React from "react";
const Loader = () => (
  <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black mb-4"></div>
  </div>
);

export default Loader;
