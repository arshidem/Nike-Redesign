import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserService } from '../../user/services/userService';
import { formatDate } from '../../../utils/dateUtils';
import { AdminUserDetailsSkeleton } from '../../../shared/ui/Skeleton';

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { fetchUserById } = useUserService();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData.data);
      } catch (err) {
        console.error('Error loading user:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUser();
    }
  }, [userId]);
console.log(user);

  if (loading) return (
  <AdminUserDetailsSkeleton/>
  );

  if (error) return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="w-full py-2 px-4 border border-black rounded hover:bg-gray-100 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
        <p className="text-gray-800 mb-4">User not found</p>
        <button 
          onClick={() => navigate('/admin#users')}
          className="w-full py-2 px-4 border border-black rounded hover:bg-gray-100 transition"
        >
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button Container */}
      <div className="fixed bg-white p-2 w-full shadow flex items-center z-10">
        <button
          onClick={() => navigate('/admin#users')}
          className="px-3 py-1 sm:px-4 sm:py-2 border border-black rounded hover:bg-gray-200 transition sm:w-auto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="size-4 transition-transform duration-300 rotate-180"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5L15.75 12 8.25 19.5"
            />
          </svg>
        </button>
      </div>

      {/* Main Content - Adjusted for fixed header */}
      <div className="pt-16 pb-4 px-4 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-gray-100 p-4 border-b border-gray-200 flex items-center">
            <div className="bg-gray-300 rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold text-gray-700">
              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold text-gray-900">{user.name || 'No name provided'}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* User Details Sections */}
          <div className="divide-y divide-gray-200">
            {/* Basic Information */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{user.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium capitalize">{user.gender || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium">{user.dob ? formatDate(user.dob) : '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{user.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Account Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-mono text-sm">{user._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <p className="font-medium capitalize">{user.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium capitalize">{user.status || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="font-medium">{user.isActive ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Verified</p>
                  <p className="font-medium">{user.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Login</p>
                  <p className="font-medium">{user.lastLogin ? formatDate(user.lastLogin) : '-'}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Dates</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Updated At</p>
                  <p className="font-medium">{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Address (if available) */}
            {user.address && (
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Street</p>
                    <p className="font-medium">{user.address.street || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">City</p>
                    <p className="font-medium">{user.address.city || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{user.address.state || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Zip Code</p>
                    <p className="font-medium">{user.address.zipCode || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="font-medium">{user.address.country || '-'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};