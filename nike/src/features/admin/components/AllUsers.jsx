import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserService } from "../../user/services/userService";
import { useAppContext } from "../../../context/AppContext";
import { formatDate } from "../../../utils/dateUtils";
import Loader from "../../../shared/ui/Loader";
import { XIcon, DeleteIcon } from "../../../shared/ui/Icons";
import { toast } from "react-toastify";
import { ConfirmModal } from "../../../shared/ui/Icons";
export const AllUsers = () => {
  const { fetchUsers, bulkDeleteUsers, bulkUpdateUserRole } = useUserService();
  const navigate = useNavigate();

  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt:desc");
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showRoleUpdateModal, setShowRoleUpdateModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    role: "",
    gender: "",
    status: "",
    isActive: "",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch users with cleaned filters
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Clean filters - remove empty values
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      const params = {
        page,
        limit: 10,
        ...(appliedSearchTerm && { search: appliedSearchTerm }),
        ...(sortBy && { sortBy }),
        ...cleanedFilters,
      };

      console.log("Fetching users with params:", params);
      const { success, data, pages } = await fetchUsers(params);

      if (success) {
        setUsers(Array.isArray(data) ? data : []);
        setTotalPages(pages || 1);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, page, appliedSearchTerm, sortBy, filters]);

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((user) => user._id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

const handleBulkDelete = () => {
  if (!selectedIds.length) return toast.error("No users selected");
  setShowDeleteConfirm(true);
};
const confirmDelete = async () => {
  try {
    setActionLoading(true);
    
    // 1. Optimistically update UI - remove deleted users immediately
    const originalUsers = [...users]; // Save for potential rollback
    setUsers(prev => prev.filter(user => !selectedIds.includes(user._id)));
    
    // 2. Perform the actual API call
    const { success } = await bulkDeleteUsers(selectedIds);
    
    if (!success) throw new Error("Delete failed");
    
    toast.success("Users deleted successfully");
    setSelectedIds([]);
    setSelectMode(false);
    setShowDeleteConfirm(false);
    
    // 3. If we're on a page that might now be empty, adjust page number
    if (users.length === selectedIds.length && page > 1) {
      setPage(prev => prev - 1);
    }
    
  } catch (err) {
    // On error, revert the optimistic update and refresh
    setUsers(originalUsers); // Rollback to original state
    toast.error(err.message || "Delete failed");
    setRefreshTrigger(prev => !prev); // Force refresh from server
  } finally {
    setActionLoading(false);
  }
};


  const handleBulkRoleUpdate = () => {
    if (!selectedIds.length) {
      toast.error("No users selected");
      return;
    }
    setShowRoleUpdateModal(true);
  };
  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]);

  // Handle search submission
  const handleSearch = useCallback(() => {
    setAppliedSearchTerm(searchTerm);
    setPage(1);
    setRefreshTrigger((prev) => !prev);
  }, [searchTerm]);

  // Handle Enter key in search input
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      role: "",
      gender: "",
      status: "",
      isActive: "",
    });
    setPage(1);
    handleRefresh();
  };

  // Apply filters and close modal
  const applyFilters = () => {
    setPage(1);
    loadUsers();
    setShowFilters(false);
  };

  // Manual refresh
  const handleRefresh = () => {
    setRefreshTrigger((prev) => !prev);
  };

  // Handle user click
  const handleUserClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Handle sort change
  const handleSort = (field) => {
    const [currentField, currentOrder] = sortBy.split(":");
    const newOrder =
      currentField === field && currentOrder === "asc" ? "desc" : "asc";
    setSortBy(`${field}:${newOrder}`);
    setPage(1);
  };

  // Loading and error states
  if (loading && page === 1)
    return (
      <div className="p-4">
        <Loader />
      </div>
    );
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex sm:flex-row gap-4 w-full">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </button>
          </div>
          <button
            onClick={() => setShowFilters(true)}
            className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
              />
            </svg>
          </button>

          <button
            onClick={handleRefresh}
            className="px-3 py-2 rounded hover:bg-gray-100 flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
          <button
            onClick={() => setSelectMode((m) => !m)}
            className="px-4 py-2 bg-black text-white rounded"
          >
            {selectMode ? "Cancel Select" : "Select Users"}
          </button>
        </div>
      </div>
      {selectMode && selectedIds.length > 0 && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <button
            onClick={toggleSelectAll}
            className="px-3 py-1 border rounded"
          >
            {selectedIds.length === users.length
              ? "Deselect All"
              : "Select All"}
          </button>
          </div>
          <div className="flex items-center gap-2">
             <button
            onClick={handleBulkDelete}
  className="px-3 py-1  rounded bg-white hover:bg-gray-200 flex items-center gap-1"
          >
            <DeleteIcon />
            <span className="ml-1">Delete</span>
          </button>
          <button
            onClick={handleBulkRoleUpdate}
  className="px-3 py-1  rounded bg-white hover:bg-gray-200 flex items-center gap-1"
          >
            Update Role
          </button>
          </div>
          
         
        </div>
      )}
      {showRoleUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Update User Role</h3>

            {/* Role Selection Pills */}
            <div className="flex flex-col gap-3 mb-6">
              {["user", "admin"].map((role) => (
                <span
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`text-center py-2 rounded-xl cursor-pointer border font-medium capitalize transition
              ${
                selectedRole === role
                  ? "bg-black text-white"
                  : "bg-white text-black border-black"
              }`}
                >
                  {role}
                </span>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  setShowRoleUpdateModal(false);
                  setSelectedRole("");
                }}
                className="flex-1 py-2 border border-black text-black rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedRole) {
                    toast.error("Please select a role");
                    return;
                  }

                  try {
                    setActionLoading(true); // ✅ start loading before API call

                    await bulkUpdateUserRole(selectedIds, selectedRole);
                    toast.success("Roles updated successfully");

                    // ✅ Optimistically update local state
                    setUsers((prevUsers) =>
                      prevUsers.map((user) =>
                        selectedIds.includes(user._id)
                          ? { ...user, role: selectedRole }
                          : user
                      )
                    );

                    setSelectMode(false);
                    setSelectedIds([]);
                    setShowRoleUpdateModal(false);
                    setSelectedRole("");
                  } catch (error) {
                    toast.error(error.message || "Failed to update roles");
                  } finally {
                    setActionLoading(false);
                  }
                }}
                disabled={actionLoading}
                className="flex-1 py-2 bg-black text-white rounded-md disabled:opacity-70"
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirm && (
 <ConfirmModal
  title={`Delete ${selectedIds.length} users?`}
  description="This action cannot be undone. Are you sure you want to proceed?"
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={confirmDelete}
  confirmLabel={actionLoading ? "Deleting..." : "Delete"}
  cancelLabel="Cancel"
  loading={actionLoading}
/>
)}

      {/* Filters Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">User Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Filter */}
                <div>
                  <label className="block text-xs sm:text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">All Roles</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                {/* Gender Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={filters.gender}
                    onChange={(e) =>
                      handleFilterChange("gender", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                {/* Active Status Filter */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Active Status
                  </label>
                  <select
                    value={filters.isActive}
                    onChange={(e) =>
                      handleFilterChange("isActive", e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded focus:ring-gray-400 focus:border-gray-400"
                  >
                    <option value="">All</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-xs sm:text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Reset Filters
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 text-xs sm:text-sm text-white bg-black rounded hover:bg-gray-800"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectMode && (
                <th className="px-6 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === users.length && users.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
              )}
              <th
                className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("name")}
              >
                User{" "}
                {sortBy.includes("name") &&
                  (sortBy.includes("asc") ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                Role
              </th>
              <th
                className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Joined{" "}
                {sortBy.includes("createdAt") &&
                  (sortBy.includes("asc") ? "↑" : "↓")}
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700">
                Active
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.length > 0 ? (
              users.map((user) => {
                const isSelected = selectedIds.includes(user._id);
                return (
                  <tr
                    key={user._id}
                    onClick={() => !selectMode && handleUserClick(user._id)}
                    className={`hover:bg-gray-50 ${
                      !selectMode ? "cursor-pointer" : ""
                    }`}
                  >
                    {selectMode && (
                      <td
                        className="px-6 py-4 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(user._id)}
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.name ? (
                            <span className="text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-gray-400">?</span>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {user.name || "Not provided"}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {user.gender || "Unknown"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-700 capitalize">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "moderator"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.name && user.gender
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.name && user.gender ? "Verified" : "Incomplete"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs sm:text-sm text-gray-700">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          user.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={selectMode ? 7 : 6}
                  className="px-4 py-6 text-center text-gray-500"
                >
                  {appliedSearchTerm || Object.values(filters).some(Boolean) ? (
                    <>
                      No users found matching your criteria
                      <button
                        onClick={resetFilters}
                        className="ml-2 text-blue-600 hover:underline"
                      >
                        Clear filters
                      </button>
                    </>
                  ) : (
                    "No users found"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs sm:text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
