import axios from 'axios';
import { useAppContext } from "../../../context/AppContext";

export const useUserService = () => {
  const { backendUrl } = useAppContext();
  const token = localStorage.getItem('token');

  const fetchUsers = async (params = {}) => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      const response = await axios.get(`${backendUrl}/api/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch user');
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await axios.put(`${backendUrl}/api/admin/users/${userId}`, userData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      const response = await axios.put(`${backendUrl}/api/admin/users/${userId}/role`, { role }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(`${backendUrl}/api/admin/users/${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/admin/users/activity/stats`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
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

  return {
    fetchUsers,
    fetchUserById,
    updateUser,
    updateUserRole,
    deleteUser,
    fetchUserStats,
    activateUser,
    deactivateUser
  };
};
