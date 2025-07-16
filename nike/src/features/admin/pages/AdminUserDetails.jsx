import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserService } from '../../user/services/userService';
import { formatDate } from '../../../utils/dateUtils';
import { BackBar, ConfirmModal } from '../../../shared/ui/Icons';
import { AdminUserDetailsSkeleton } from '../../../shared/ui/Skeleton';

export const AdminUserDetails = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { fetchUserById, deleteUser, updateUserRole } = useUserService();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserById(userId);
        setUser(userData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (userId) loadUser();
  }, [userId]);

  const handleRoleChange = async (e) => {
    const newRole = e.target.value;
    if (newRole === user.role) return;
    try {
      setActionLoading(true);
      await updateUserRole(user._id, newRole);
      setUser((prev) => ({ ...prev, role: newRole }));
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(true);
      await deleteUser(user._id);
      setShowDeleteModal(false);
      navigate("/admin#users");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <AdminUserDetailsSkeleton />;

  if (error || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow max-w-md text-center">
          <p className="text-gray-700">{error || 'User not found'}</p>
          <button
            onClick={() => navigate('/admin#users')}
            className="mt-4 px-4 py-2 border border-black rounded hover:bg-gray-100 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Fixed Back Bar */}
      <BackBar />

      {/* Main Card */}
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 pt-20 pb-10">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-2xl">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-black">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="border-t pt-4 mb-4">
            <h2 className="font-semibold text-lg text-black mb-3">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p>{user.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p>{user.gender || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Date of Birth</p>
                <p>{user.dob ? formatDate(user.dob) : '-'}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p>{user.phone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t pt-4 mb-4">
            <h2 className="font-semibold text-lg text-black mb-3">Account Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">User ID</p>
                <p className="font-mono text-xs">{user._id}</p>
              </div>
              <div>
                <p className="text-gray-500">Role</p>
                <p>{user.role}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p>{user.isActive ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-gray-500">Verified</p>
                <p>{user.isVerified ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-gray-500">Last Login</p>
                <p>{user.lastLogin ? formatDate(user.lastLogin) : '-'}</p>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="border-t pt-4">
            <h2 className="font-semibold text-lg text-black mb-3">Admin Actions</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <select
                className="border border-gray-300 px-4 py-2 rounded-md w-full sm:w-auto"
                value={user.role}
                onChange={handleRoleChange}
                disabled={actionLoading}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={actionLoading}
                className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>

        {showDeleteModal && (
          <ConfirmModal
            title="Delete User?"
            description="This action is irreversible. Are you sure you want to delete this user?"
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onClose={() => setShowDeleteModal(false)}
            onConfirm={confirmDelete}
            loading={actionLoading}
          />
        )}
      </div>
    </>
  );
};
