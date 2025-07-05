import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUserService } from "../../user/services/userService";
import { useAppContext } from "../../../context/AppContext";
import { formatDate } from "../../../utils/dateUtils";
import Loader from "../../../shared/ui/Loader";
import { XIcon } from "../../../shared/ui/Icons";

export const AllUsers = () => {
  const { fetchUsers } = useUserService();
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

  useEffect(() => {
    loadUsers();
  }, [refreshTrigger]);

  // Handle search submission
 const handleSearch = useCallback(() => {
  setAppliedSearchTerm(searchTerm);
  setPage(1);
  setRefreshTrigger(prev => !prev); // This will trigger the useEffect
}, [searchTerm]);

// Update your useEffect dependency array
useEffect(() => {
  loadUsers();
}, [ refreshTrigger]); // Add loadUsers to dependencies

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
    // Special case for createdAt since we're using a different format in the API
    if (field === "createdAt") {
      const [currentField, currentOrder] = sortBy.split(":");
      const newOrder =
        currentField === "createdAt" && currentOrder === "asc" ? "desc" : "asc";
      setSortBy(`createdAt:${newOrder}`);
    } else {
      // Handle other fields normally
      const [currentField, currentOrder] = sortBy.split(":");
      const newOrder =
        currentField === field && currentOrder === "asc" ? "desc" : "asc";
      setSortBy(`${field}:${newOrder}`);
    }
    setPage(1);
  };

  // Loading and error states
  if (loading && page === 1) return <div className="p-4"><Loader/></div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;


  
  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">

        <div className=" flex sm:flex-row gap-4 w-full">
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
            className="px-3 py-2  rounded hover:bg-gray-100 flex items-center gap-2"
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
        </div>
      </div>

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
                    <option value="moderator">Moderator</option>
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
              users.map((user) => (
                <tr
                  key={user._id}
                  onClick={() => handleUserClick(user._id)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
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
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
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
