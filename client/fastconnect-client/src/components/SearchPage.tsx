"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import type { User } from "../types/User"
import Navbar from "./Navbar"

// Add this after the imports and before the component
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0,-30px,0); }
    70% { transform: translate3d(0,-15px,0); }
    90% { transform: translate3d(0,-4px,0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out;
  }
  
  .animate-slideInRight {
    animation: slideInRight 0.6s ease-out;
  }
  
  .animation-delay-100 {
    animation-delay: 0.1s;
    animation-fill-mode: both;
  }
  
  .animation-delay-200 {
    animation-delay: 0.2s;
    animation-fill-mode: both;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    animation-fill-mode: both;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s infinite;
  }
  
  .animate-bounce-slow {
    animation: bounce 2s infinite;
  }
`

const Search = () => {
  const { token, user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("none")
  const [profiles, setProfiles] = useState<User[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoriteProfiles, setFavoriteProfiles] = useState<User[]>([])
  const [showFavorites, setShowFavorites] = useState(false)
  const [loading, setLoading] = useState(false)
  const [favoritesLoading, setFavoritesLoading] = useState(false)
  const [showFavoritesLoading, setShowFavoritesLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
    return () => {
      document.head.removeChild(styleSheet)
    }
    
  }, [])

  useEffect(() => {
    document.body.style.scrollBehavior = 'smooth'
    return () => {
      document.body.style.scrollBehavior = ''
    }
  }, [])

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U"

  const isFavorited = (id: string) => favorites.includes(id)

  const toast = (msg: string) => {
    setError(msg)
    const timer = setTimeout(() => {
      setError(null)
    }, 3000)
    return () => clearTimeout(timer)
  }

  // Load online users
  const fetchOnlineUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/profile/online', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch online users');
      
      const response = await res.json();
      
      // Check if the response has the expected structure
      if (!response.success || !Array.isArray(response.users)) {
        console.error('Unexpected response format:', response);
        return [];
      }
      
      // Extract just the IDs of online users
      return response.users.map((user: any) => user._id);
    } catch (err) {
      console.error('Error fetching online users:', err);
      toast('Failed to load online users');
      return [];
    }
  };

  // Load profiles
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user ID from token
      const currentUserId = user?._id;
      let query = searchQuery;
      
      // If online filter is selected, fetch online users first
      if (filterType === 'online') {
        const onlineUserIds = await fetchOnlineUsers();
        if (onlineUserIds.length === 0) {
          setProfiles([]);
          return;
        }
        // Use the online user IDs as the query
        query = onlineUserIds.join(',');
      }
      
      let params = new URLSearchParams({
        page: "1",
        limit: "20"
      });

      if (filterType === 'online') {
        // For online users, we need to pass the IDs as a comma-separated list
        const onlineUserIds = await fetchOnlineUsers();
        if (onlineUserIds.length > 0) {
          // Add all IDs as a single comma-separated parameter
          params.append('_id', onlineUserIds.join(','));
        }
      } else if (filterType === 'name' && query) {
        params.append('name', query);
        params.append('searchType', 'name');
      } else if (filterType === 'campus' && query) {
        params.append('campus', query);
        params.append('searchType', 'campus');
      }

      // Log the URL for debugging
      const url = `http://localhost:5000/api/auth/search-users?${params.toString()}`;
      console.log('Fetching URL:', url);
      
      console.log('Filter type:', filterType);
      console.log('Query params:', Object.fromEntries(params.entries()));
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to fetch profiles")

      const data = await res.json()
      console.log('API Response:', JSON.stringify(data, null, 2));
      
      // Process users and ensure isOnline is set correctly
      const processedUsers = (data.users || []).map((user: any) => {
        // Check both lastActive and lastSeen fields
        const lastActiveTime = user.lastActive || user.lastSeen;
        const lastActive = lastActiveTime ? new Date(lastActiveTime).getTime() : 0;
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
        const isUserOnline = user.isOnline === true || lastActive > fiveMinutesAgo;
        
        console.log('Processing user:', user._id, 'isOnline:', isUserOnline, 'lastActive:', lastActiveTime);
        
        return {
          ...user,
          isOnline: isUserOnline,
          lastActive: lastActiveTime || null,
          lastSeen: user.lastSeen || null
        } as User;
      });
      
      // Filter out the current user from the results
      const filteredUsers = processedUsers.filter((user: User) => {
        console.log('Processing user:', user._id, 'isOnline:', user.isOnline, 'Current user ID:', currentUserId);
        return user._id !== currentUserId;
      });
      
      console.log('Filtered users:', filteredUsers);
      setProfiles(filteredUsers)
    } catch (err) {
      console.error(err)
      toast("Could not load profiles")
    } finally {
      setLoading(false)
    }
  }

  // Load favorites
  const fetchFavorites = async () => {
    if (!token) {
      setError("Please login to view favorites")
      return
    }

    setShowFavoritesLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/auth/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Failed to fetch favorites")

      const data = await res.json()
      // Filter out the current user from favorites
      const currentUserId = user?._id;
      const filteredFavorites = data.favorites.filter((favUser: User) => favUser._id !== currentUserId);
      setFavorites(filteredFavorites.map((u: User) => u._id))
      setFavoriteProfiles(filteredFavorites)
    } catch (err) {
      console.error(err)
      toast("Failed to fetch favorites")
    } finally {
      setShowFavoritesLoading(false)
    }
  }

  // Toggle favorites UI
  const toggleShowFavorites = () => {
    if (!showFavorites) fetchFavorites();
    setShowFavorites(prev => !prev);
    setFilterType('none');
    setSearchQuery('');
  };
  
  // Handle filter type change
  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilterType = e.target.value;
    setFilterType(newFilterType);
    setSearchQuery('');
    
    // If online filter is selected, we'll handle it in the fetchUsers function
    if (newFilterType === 'online') {
      fetchUsers();
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (id: string) => {
    if (!token) return toast("Login first")

    setFavoritesLoading(true)
    try {
      const method = isFavorited(id) ? "DELETE" : "POST"
      const url = `http://localhost:5000/api/auth/favorites/${isFavorited(id) ? "remove" : "add"}/${id}`

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) throw new Error("Failed to update favorite")

      if (isFavorited(id)) {
        setFavorites((prev) => prev.filter((x) => x !== id))
        setFavoriteProfiles((prev) => prev.filter((p) => p._id !== id))
        toast("Removed from favorites")
      } else {
        const prof = profiles.find((p) => p._id === id)
        if (prof) setFavoriteProfiles((prev) => [...prev, prof])
        setFavorites((prev) => [...prev, id])
      
        toast("Added to favorites")
      }
    } catch (err) {
      console.error(err)
      toast("Error updating favorite")
    } finally {
      setFavoritesLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery("")
    setFilterType("none")
    fetchUsers()
  }

  // Load list when token changes
  useEffect(() => {
    fetchUsers()
    if (token) fetchFavorites()
  }, [token])

  // Debounce search/filter
  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 500)
    return () => clearTimeout(timeout)
  }, [searchQuery, filterType])

  // Filter profiles based on search query and type
  const filteredProfiles = (showFavorites ? favoriteProfiles : profiles).filter((profile) => {
    // For online filter, we trust the backend to return only online users
    if (filterType === 'online') {
      // Just log that we're showing this user as they came from the online users endpoint
      console.log('Showing online user:', profile._id, 'name:', profile.name);
      return true;
    }
    
    // For other filter types, apply the search query if any
    if (searchQuery === "") return true;
    
    const query = searchQuery.toLowerCase();
    const profileName = typeof profile.name === 'string' ? profile.name.toLowerCase() : '';
    const profileCampus = typeof profile.campus === 'string' ? profile.campus.toLowerCase() : '';
    const profileDept = typeof profile.department === 'object' && profile.department?.name 
      ? profile.department.name.toLowerCase() 
      : '';
    const profileBatch = typeof profile.batch === 'object' && profile.batch?.year 
      ? profile.batch.year.toString() 
      : '';
    
    if (filterType === "name") {
      return profileName.includes(query);
    } else if (filterType === "campus") {
      return profileCampus.includes(query);
    } else {
      // Search in all fields
      return (
        profileName.includes(query) ||
        profileCampus.includes(query) ||
        profileDept.includes(query) ||
        profileBatch.includes(query)
      );
    }
  });
  
  // Determine the display text based on the current filter
  const getDisplayText = () => {
    if (showFavorites) return `${favoriteProfiles.length} Favorites`;
    if (filterType === 'online') return `${filteredProfiles.length} Online Students`;
    return `${filteredProfiles.length} Students Found`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            {showFavorites ? (
              <>
                My <span className="text-emerald-600">Favorites</span>
              </>
            ) : (
              <>
                Find <span className="text-emerald-600">Students</span>
              </>
            )}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {showFavorites
              ? "Your saved connections and favorite Fast University students"
              : "Connect with fellow Fast University students across all campuses. Search by name or filter by campus to find study partners and collaborators."}
          </p>
        </div>

        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 animate-slideInUp animation-delay-100">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl font-bold text-gray-900">
              {getDisplayText()}
            </h2>
            <p className="text-gray-600 mt-1">
              {showFavorites
                ? "Your saved student connections"
                : filterType === "none"
                  ? "Showing all registered Fast University students"
                  : `Filtered by ${filterType}${searchQuery ? `: "${searchQuery}"` : ""}`}
            </p>
          </div>

          <button
            className="group relative px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            onClick={toggleShowFavorites}
            disabled={showFavoritesLoading}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-center space-x-2">
              {showFavoritesLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showFavorites ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    )}
                  </svg>
                  <span>{showFavorites ? "Show All Students" : "Show My Favorites"}</span>
                  {!showFavorites && favorites.length > 0 && (
                    <span className="bg-white/20 text-white text-xs rounded-full px-2 py-1 ml-2">
                      {favorites.length}
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-teal-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Search Controls */}
        {!showFavorites && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-12 animate-slideInUp">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0 4a2 2 0 100 4m0-4a2 2 0 110-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4a2 2 0 110-4m0 4a2 2 0 100 4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Search & Filter</h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Filter Type Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Search Filter</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 hover:border-emerald-300"
                  value={filterType}
                  onChange={handleFilterTypeChange}
                >
                 <option value="none">Show All Students</option>
                 <option value="name">Search by Name</option>
                 <option value="campus">Filter by Campus</option>
                 <option value="online">Show Online Students</option>

                </select>
              </div>

              {/* Search Input */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {filterType === "name" ? "Search by Name" : filterType === "campus" ? "Enter Campus Name" : "Search"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <input
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                    type="text"
                    value={searchQuery}
                    placeholder={filterType === "name"
                      ? "Enter student name..."
                      : filterType === "campus"
                        ? "Enter campus name..."
                        : filterType === "online"
                          ? "No input needed for online filter"
                          : "Select a filter type to search..."}
                    
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={filterType === "none" || filterType === "online"}

                  />
                  {searchQuery && (
                    <button onClick={clearSearch} className="absolute inset-y-0 right-0 pr-3 flex items-center group">
                      <div className="bg-emerald-100 hover:bg-emerald-200 rounded-full p-1 transition-colors duration-200">
                        <svg
                          className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading and Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : filteredProfiles.length === 0 ? (
          <div className="text-center text-gray-500">
            {filterType === 'online' 
              ? 'No online students found' 
              : 'No students found'}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredProfiles.map((profile, index) => (
              <div
                key={profile._id}
                className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slideInUp h-40 flex flex-col justify-between"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Profile Header */}
                <div className="flex items-center justify-between mb-4 flex-1">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110">
                        <span className="text-white text-xl font-bold">{getInitials(profile.name)}</span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{profile.name || "Unknown"}</h3>
                      <p className="text-sm text-gray-600 truncate">Batch {profile.batch?.year || "N/A"}</p>
                      <p className="text-xs text-gray-500 flex items-center mt-1 truncate">
                        <svg
                          className="w-3 h-3 mr-1 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <span className="truncate">{profile.campus || "Unknown Campus"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Favorite Star */}
                  <button
                    onClick={() => toggleFavorite(profile._id)}
                    className="group p-2 text-gray-400 hover:text-yellow-500 transition-all duration-300 transform hover:scale-125 focus:outline-none focus:ring-2 focus:ring-yellow-300 rounded-full"
                    disabled={favoritesLoading}
                  >
                    <svg
                      className={`w-6 h-6 transition-all duration-300 ${
                        isFavorited(profile._id)
                          ? "text-yellow-500 fill-current transform scale-110"
                          : "text-gray-400 hover:text-yellow-500 group-hover:scale-110"
                      }`}
                      fill={isFavorited(profile._id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363 1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button className="flex-1 bg-emerald-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Video
                  </button>
                  <button className="flex-1 bg-teal-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center transform hover:scale-105">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Voice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (showFavorites ? favoriteProfiles.length === 0 : profiles.length === 0) && (
          <div className="text-center py-16 animate-fadeIn">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-8">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showFavorites ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                )}
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {showFavorites ? "No favorites yet" : "No students found"}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {showFavorites
                ? "Start adding students to your favorites by clicking the star icon on their profiles."
                : "Try adjusting your search criteria or browse all students by selecting 'Show All Students'."}
            </p>
            {!showFavorites && (
              <button
                onClick={clearSearch}
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-300"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Show All Students
              </button>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 Fast Connect. Exclusively for Fast University Students. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Search
