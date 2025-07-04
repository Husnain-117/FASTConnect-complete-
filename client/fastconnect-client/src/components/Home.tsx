"use client"
import { useAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom"
import Navbar from "./Navbar"

const Home = () => {
  const { user, logout, userId } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const handleVideoCall = () => {
    navigate("/video-call")
  }

  const handleVoiceCall = () => {
    navigate("/voice-call")
  }

  const goToProfile = () => {
    if (userId && userId !== 'undefined') {
      navigate('/profile')
    } else {
      navigate('/login')
    }
  }

  const handleAbout = () => {
    navigate("/about")
  }
  const handleSearch = () => {
    navigate("/search")
  }
const handleGuidelines = () => {
    navigate("/guidelines")
  }
  return (
    <div className="min-h-screen bg-gray-50">
    <Navbar />
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Fast Connect — Secure and Professional
            <span className="block text-emerald-600">University Communication Platform</span>
          </h1>
        </div>

        {/* Description Section */}
        <div className="prose prose-lg mx-auto text-gray-600 leading-relaxed">
          <p className="text-xl mb-8 text-center">
            Fast Connect provides a secure video and voice communication platform exclusively designed for Fast
            University students to connect, collaborate, and build meaningful relationships across all campuses
            nationwide.
          </p>

          <div className="space-y-6 text-lg">
            <p>
              Our platform bridges the gap between students from different campuses including Islamabad, Lahore,
              Karachi, Peshawar, Multan, Faisalabad, and Chiniot-Faisalabad, fostering a unified university community
              where knowledge sharing and academic collaboration thrive.
            </p>

            <p>
              To ensure a safe, respectful, and productive environment for all Fast University students, we have
              established comprehensive guidelines and security measures. Our dedicated moderation team monitors
              platform usage to maintain academic integrity and professional standards.
            </p>

            <p>
              By using Fast Connect, you agree to uphold the values of Fast University and contribute to a positive
              learning environment. If you cannot comply with our community standards, we kindly ask you to refrain from
              using the platform.
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-2 gap-8">
          {/* Video Chat Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">HD Video Communication</h3>
              <p className="text-gray-600 mb-6">
                Connect face-to-face with fellow students for study groups, project discussions, and academic
                collaboration.
              </p>
              <button
                onClick={handleVideoCall}
                className="w-full bg-emerald-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Start Video Chat
              </button>
            </div>
          </div>

          {/* Voice Chat Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Crystal Clear Voice Calls</h3>
              <p className="text-gray-600 mb-6">
                Quick voice conversations for instant help, study sessions, and maintaining connections with your
                university network.
              </p>
              <button
                onClick={handleVoiceCall}
                className="w-full bg-teal-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-colors duration-200"
              >
                Start Voice Call
              </button>
            </div>
          </div>
        </div>

        {/* Guidelines Preview */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Community Guidelines</h2>

          <div className="space-y-4 text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>
                <strong>Maintain Academic Integrity:</strong> Use the platform for educational purposes and professional
                networking.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>
                <strong>Respect University Values:</strong> Uphold the principles and code of conduct of Fast
                University.
              </p>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p>
                <strong>Professional Communication:</strong> Maintain respectful and constructive dialogue at all times.
              </p>
            </div>
          </div>
        </div>
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

export default Home
