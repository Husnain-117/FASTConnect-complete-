"use client"
import { useAuth } from "../context/AuthContext"
import { useNavigate, Link } from "react-router-dom"

const Navbar = () => {
  const { user, logout, userId } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    console.log('Logout button clicked, starting logout process...');
    try {
      console.log('Calling logout function from AuthContext...');
      await logout();
      console.log('Logout successful, navigating to login page...');
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  const goToProfile = () => {
    if (userId) {
      navigate(`/profile/${userId}`)
    } else {
      navigate("/login")
    }
  }

  const goToSearch = () => {
    navigate("/search")
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand / Logo */}
          <Link to="/home" className="flex items-center space-x-3 cursor-pointer group">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg group-hover:scale-105 transition-transform duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors duration-200">Fast Connect</h1>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <a
              href={userId ? `/profile/${userId}` : "/login"}
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">Profile</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
            <a
              href="/video-call"
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">Video Chat</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
            <a
              href="/voice-call"
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">Voice Chat</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
            <a
              href="/text-chat"
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">Text Chat</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
            
            <a
              href="/search"
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">Search</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
            <a
              href="/about"
              className="group relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-all duration-300 ease-in-out"
            >
              <span className="relative z-10">About</span>
              <div className="absolute inset-0 bg-emerald-50 rounded-lg scale-0 group-hover:scale-100 transition-transform duration-300 ease-out" />
            </a>
           
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Profile Avatar Button */}
            <div
              className="flex items-center space-x-3 group cursor-pointer"
              onClick={goToProfile}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-200">
                <span className="text-white text-sm font-medium">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors duration-200">
                {user?.name || "User"}
              </span>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 ease-in-out transform hover:scale-105"
            >
              <svg
                className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="relative">
                Logout
                <div className="absolute inset-x-0 bottom-0 h-0.5 bg-red-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
