// /shared/ui/Skeletons.jsx
import React from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

// 👉 Product Details Page Skeleton
export const ProductDetailsSkeleton = () => (
  <div className="max-w-6xl mx-auto p-6">
    <div className="flex flex-col lg:flex-row gap-8 mt-10">
      <div className="w-full lg:w-1/2 space-y-4">
        <Skeleton height={450} className="rounded" />
        <div className="flex gap-2 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={80} height={80} className="rounded" />
          ))}
        </div>
        <Skeleton width={150} height={20} />
      </div>
      <div className="lg:w-1/2 space-y-4">
        <Skeleton width="60%" height={30} />
        <Skeleton width="40%" height={24} />
        <Skeleton width="30%" height={20} />
        <div className="grid grid-cols-4 gap-2 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height={36} />
          ))}
        </div>
        <Skeleton height={48} className="rounded-full mt-6" />
        <Skeleton count={4} className="mt-4" />
      </div>
    </div>
  </div>
);

// 👉 Cart Page Skeleton
export const CartSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 mt-8">
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* Bag Section */}
        <div className="flex-1">
          <div className="text-center mb-8">
            <Skeleton height={30} width={80} className="mx-auto mb-2" />
            <Skeleton height={20} width={120} className="mx-auto" />
          </div>
          <ul className="space-y-8">
            {Array.from({ length: 3 }).map((_, idx) => (
              <li key={idx} className="flex gap-6 border-b pb-6">
                <Skeleton className="w-40 h-40 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton width={150} height={20} />
                  <Skeleton width={100} height={16} />
                  <Skeleton width={140} height={16} />
                  <Skeleton width={160} height={14} />
                  <Skeleton width={120} height={30} className="mt-2" />
                </div>
                <Skeleton width={60} height={20} />
              </li>
            ))}
          </ul>
        </div>

        {/* Summary Section */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg sticky top-4 space-y-4">
            <Skeleton height={24} width={120} />
            <Skeleton height={16} width={`100%`} />
            <Skeleton height={16} width={`100%`} />
            <Skeleton height={24} width={`100%`} />
            <Skeleton height={40} width={`100%`} className="rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

// 👉 Checkout Skeleton
export const CheckoutSkeleton = () => {
  return (
    <div className="max-w-5xl mx-auto p-4 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: Address Form Skeleton */}
      <div>
        <Skeleton height={24} width={180} className="mb-4" />
        <Skeleton height={40} className="mb-2" />
        <Skeleton height={16} width={240} className="mb-6" />
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="space-y-2 mb-4">
            <Skeleton height={40} />
            <Skeleton height={40} />
          </div>
        ))}
      </div>

      {/* RIGHT: Cart Summary Skeleton */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <Skeleton height={24} width={160} className="mb-4" />

        <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton height={80} width={80} />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="60%" />
                <Skeleton height={14} width="40%" />
                <Skeleton height={16} width="50%" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="100%" />
          <Skeleton height={24} width="100%" className="mt-4" />
        </div>

        <Skeleton height={40} className="mt-6 rounded-full" />
        <Skeleton height={12} width={180} className="mt-2 mx-auto" />
      </div>
    </div>
  );
};

export const OrderSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mt-8">
      <Skeleton height={32} width={200} className="mb-6" />

      <div className="space-y-4">
        {[1, 2, 3].map((_, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4 bg-white rounded-lg border shadow-sm"
          >
            <Skeleton width={80} height={80} />

            <div className="flex-1 space-y-2">
              <Skeleton width={120} height={20} />
              <Skeleton width={160} height={16} />
              <Skeleton width={100} height={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export const ModelSkeleton = () => {
  return (
    <div className="mt-4 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 bg-white rounded-lg shadow">
          <Skeleton height={160} className="mb-4" />
          <Skeleton width="30%" height={14} />
          <Skeleton width="80%" height={16} className="mt-2" />
          <Skeleton width="60%" height={14} />
          <Skeleton width="70%" height={16} className="mt-2" />
        </div>
      ))}
    </div>
  );
};
export const OrderDetailsSkeleton = () => (
  <div className="max-w-4xl mx-auto p-6 mt-8 text-black">
    {/* Heading */}
    <Skeleton height={32} width={180} className="mb-6" />

    {/* Tracking section */}
    <div className="mb-6">
      <Skeleton height={20} width={150} className="mb-2 mx-auto" />
      <Skeleton height={20} width={220} className="mb-4 mx-auto" />
      <div className="flex justify-between gap-2">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="flex flex-col items-center w-full">
            <Skeleton circle width={32} height={32} />
            <Skeleton height={12} width={80} className="mt-2" />
            <Skeleton height={10} width={50} />
          </div>
        ))}
      </div>
    </div>

    {/* Summary grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="space-y-2">
        <Skeleton width={180} height={16} />
        <Skeleton width={120} height={16} />
        <Skeleton width={160} height={16} />
        <Skeleton width={150} height={16} />
      </div>
      <div className="space-y-2">
        <Skeleton width={140} height={16} />
        <Skeleton width={130} height={16} />
        <Skeleton width={120} height={16} />
        <Skeleton width={160} height={20} />
      </div>
    </div>

    {/* Shipping address */}
    <div className="bg-gray-100 p-4 rounded mb-6 space-y-2">
      <Skeleton width={150} height={18} />
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} width="70%" height={14} />
      ))}
    </div>

    {/* Product Items */}
    <div className="bg-white p-4 rounded shadow-sm">
      <Skeleton width={100} height={18} className="mb-4" />
      {[...Array(2)].map((_, i) => (
        <div key={i} className="flex items-center justify-between border-b py-3">
          <Skeleton height={56} width={56} />
          <Skeleton height={16} width="50%" />
          <Skeleton height={16} width={60} />
        </div>
      ))}
    </div>
  </div>
);
export const ProfileSkeleton = () => (
  <div className="p-6 max-w-4xl mx-auto">
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 mt-10">
      <Skeleton circle width={80} height={80} />
      <div>
        <Skeleton width={140} height={20} />
        <Skeleton width={180} height={14} />
      </div>
    </div>

    {/* Tabs */}
    <div className="flex gap-6 mb-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} width={60} height={20} />
      ))}
    </div>

    {/* Interest Cards */}
    {[...Array(3)].map((_, i) => (
      <div key={i} className="mb-6">
        <Skeleton width={100} height={18} className="mb-2" />
        <div className="flex flex-wrap gap-2">
          {[...Array(4)].map((__, j) => (
            <Skeleton key={j} width={70} height={28} borderRadius={999} />
          ))}
        </div>
      </div>
    ))}
  </div>
);


export const AdminProductDetailsSkeleton = () => (
  <div className="max-w-7xl mx-auto sm:pt-14 pt-12 px-4">
    <Skeleton height={32} width={240} className="mb-4" />

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Image */}
      <div className="border rounded overflow-hidden">
        <Skeleton height={384} />
      </div>

      {/* Right: Details */}
      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <Skeleton height={24} width={180} className="mb-3" />
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[...Array(8)].map((_, i) => (
              <div key={i}>
                <Skeleton height={12} width={80} />
                <Skeleton height={18} width={100} />
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <Skeleton height={24} width={200} className="mb-3" />
          <Skeleton count={3} height={14} />
        </div>

        {/* Flags */}
        <div>
          <Skeleton height={24} width={120} className="mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton circle width={16} height={16} />
                <Skeleton width={60} height={14} />
              </div>
            ))}
          </div>
        </div>

        {/* Tags & Badges */}
        <div>
          <Skeleton height={24} width={160} className="mb-3" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton width={60} height={14} />
              <div className="flex flex-wrap gap-1 mt-1">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} width={40} height={20} borderRadius={999} />
                ))}
              </div>
            </div>
            <div>
              <Skeleton width={60} height={14} />
              <div className="flex flex-wrap gap-1 mt-1">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} width={50} height={20} borderRadius={999} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
export const AdminUserDetailsSkeleton = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 animate-pulse">
      <div className="fixed bg-white p-2 w-full shadow z-10 flex items-center">
        <div className="h-8 w-8 bg-gray-200 rounded" />
      </div>

      <div className="pt-16 max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center">
            <div className="bg-gray-300 rounded-full h-16 w-16"></div>
            <div className="ml-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-48 bg-gray-200 rounded"></div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 space-y-3">
                <div className="h-4 w-40 bg-gray-200 rounded"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="space-y-2">
                      <div className="h-3 w-24 bg-gray-200 rounded"></div>
                      <div className="h-4 w-40 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UpdateProductSkeleton = () => {
  return (
    <div>
      <div className="fixed bg-white p-2 w-full shadow flex items-center z-10">
        <Skeleton className="w-8 h-8 rounded" />
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>

          {/* Featured Image Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Skeleton className="h-6 w-48 mb-4" />
            <Skeleton className="h-48 w-full" />
          </div>

          {/* Variants Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Skeleton className="h-6 w-48 mb-4" />
            
            {[...Array(2)].map((_, variantIndex) => (
              <div key={variantIndex} className="mb-8 border-b pb-6 last:border-b-0">
                <div className="flex justify-between items-center mb-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  
                  {[...Array(3)].map((_, sizeIndex) => (
                    <div key={sizeIndex} className="grid grid-cols-3 gap-3 mb-3">
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                      <Skeleton className="h-10" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <Skeleton className="h-10 w-48 mt-4" />
          </div>

          {/* SEO & Marketing Section */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
};


export const AccountDetailsSkeleton = () => {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <div className="space-y-5">
        {/* Name */}
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Email */}
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Phone */}
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Date of Birth */}
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Location Section */}
        <div className="mt-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="space-y-4">
            {/* Country */}
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* State */}
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* City */}
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>

            {/* Postal Code */}
            <div>
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="border-t pt-6 mt-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
        </div>

        {/* Save Button */}
        <Skeleton className="h-10 w-full mt-4 rounded-full" />
      </div>
    </div>
  );
};


export const DeliveryAddressesSkeleton = () => {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>

      {/* Address List */}
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border p-4 rounded relative">
            {/* Default Badge */}
            <Skeleton className="absolute top-2 right-2 h-5 w-16 rounded" />
            
            {/* Address Content */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-48" />
            </div>
            
            {/* Edit Button */}
            <Skeleton className="absolute bottom-2 right-2 h-5 w-5 rounded-full" />
          </div>
        ))}
      </div>

      {/* Empty State (commented out since we're showing skeleton addresses) */}
      {/* <div className="text-center text-gray-500 mt-8 space-y-2">
        <Skeleton className="h-5 w-64 mx-auto" />
        <Skeleton className="h-4 w-80 mx-auto" />
      </div> */}

      {/* Form Modal Skeleton */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-xl w-[90%] max-w-lg relative">
          {/* Modal Header */}
          <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="flex-1 h-10" />
            </div>
            
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            <Skeleton className="w-full h-10" />
            
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
            </div>

            {/* Form Buttons */}
            <div className="flex justify-between gap-3 pt-2">
              <Skeleton className="flex-1 h-10" />
              <Skeleton className="flex-1 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-xl w-[90%] max-w-md">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <div className="flex justify-end gap-3">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
};


export const FeaturedSkeleton = () => {
  return (
    <div className="featured-skeleton">
      {/* Title */}
      <Skeleton className="h-8 w-40 mx-auto mb-8" />

      {/* Main Container */}
      <div className="featured-container-skeleton bg-gray-100">
        {/* Shoe Card */}
        <div className="shoe-card-skeleton">
          {/* Text Side */}
          <div className="text-side-skeleton">
            <Skeleton className="h-10 w-64 mb-6" />
            <Skeleton className="h-12 w-32 rounded-full" />
          </div>

          {/* Image Side - Just the container */}
          <div className="image-side-skeleton">
            <Skeleton className="w-full h-full" />
          </div>

          {/* Nike Text */}
          <div className="big-nike-text-container-skeleton">
            <Skeleton className="big-nike-text-skeleton" />
            <Skeleton className="big-nike-text-skeleton mirrored" />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="nav-buttons-skeleton">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <style jsx>{`
        .featured-skeleton {
          padding: 20px;
        }
        
        .featured-container-skeleton {
          position: relative;
          border-radius: 20px;
          padding: 40px;
          height: 500px;
          overflow: hidden;
        }
        
        .shoe-card-skeleton {
          display: flex;
          height: 100%;
          position: relative;
        }
        
        .text-side-skeleton {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-right: 40px;
          z-index: 2;
        }
        
        .image-side-skeleton {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        
        .big-nike-text-container-skeleton {
          position: absolute;
          top: 50%;
          left: 0;
          transform: translateY(-50%);
          width: 100%;
          overflow: hidden;
          z-index: 0;
        }
        
        .big-nike-text-skeleton {
          font-size: 120px;
          font-weight: 900;
          color: rgba(0,0,0,0.03);
          line-height: 0.8;
          white-space: nowrap;
        }
        
        .big-nike-text-skeleton.mirrored {
          transform: rotate(180deg) translateY(20px);
        }
        
        .nav-buttons-skeleton {
          position: absolute;
          bottom: 30px;
          right: 30px;
          display: flex;
          gap: 15px;
          z-index: 3;
        }
      `}</style>
    </div>
  );
};