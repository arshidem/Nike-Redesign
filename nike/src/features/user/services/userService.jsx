import axios from 'axios';
import { useAppContext } from "../../../context/AppContext";

export const useUserService = () => {
  const { backendUrl } = useAppContext();
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const fetchUsers = async (params = {}) => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users`, {
        headers,
        params,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  };

  const fetchUserById = async (userId) => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users/${userId}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/admin/users/${userId}`, userData, { headers });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const response = await axios.put(`${backendUrl}/api/admin/users/${userId}/role`, { role }, { headers });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/admin/users/${userId}`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users/activity/stats`, { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user stats');
    }
  };

  const activateUser = async (userId) => {
    return updateUser(userId, { isActive: true });
  };

  const deactivateUser = async (userId) => {
    return updateUser(userId, { isActive: false });
  };

  // ✅ Bulk delete users
const bulkDeleteUsers = async (userIds) => {
  try {
    const response = await axios.delete(
      `${backendUrl}/api/admin/users/bulk`,
      {
        data: { ids: userIds },     // ✅ request body
        headers: headers,           // ✅ config object
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error bulk deleting users:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete users');
  }
};

  // ✅ Fixed bulk update roles
  const bulkUpdateUserRole = async (userIds, role) => {
    try {
      // Validate input first
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error('At least one user ID is required');
      }

      const response = await axios.put(
        `${backendUrl}/api/admin/users/bulk/role`,
        { 
          ids: userIds,  // Consistent parameter name with backend
          role 
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk updating user roles:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Failed to update user roles';
      throw new Error(errorMessage);
    }
  };
  return {
    fetchUsers,
    fetchUserById,
    updateUser,
    updateUserRole,
    deleteUser,
    fetchUserStats,
    activateUser,
    deactivateUser,
    bulkDeleteUsers,       // ⬅️ new
    bulkUpdateUserRole,    // ⬅️ new
  };
};
