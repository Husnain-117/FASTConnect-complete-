"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import Cropper from "react-easy-crop"
// @ts-ignore
import getCroppedImg from "../utils/cropImage"
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
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  
  .animate-slideInUp {
    animation: slideInUp 0.6s ease-out;
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
`

const Profile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>()
  const { user, logout, userId: authUserId } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    campus: "",
    batch: "",
    gender: "",
    age: "",
    aboutMe: "",
    nickname: "",
    profilePhoto: "",
  })

  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profileExists, setProfileExists] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [showCropper, setShowCropper] = useState<boolean>(false)
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined)

  // Add this right after the component declaration
  
  useEffect(() => {
    const styleSheet = document.createElement("style")
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
    return () => { document.head.removeChild(styleSheet) }
  }, [])

  const fetchProfile = async () => {
    if (!userId) return

    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (res.status === 404) {
        setProfileExists(false)
        setShowForm(false)
        return
      }

      const data = await res.json()

      if (res.ok) {
        if (data.message === "Profile not set yet") {
          setProfileExists(false)
          setShowForm(false)
          setError("")
          return
        }

        setForm({
          campus: data.campus || "",
          batch: data.batch || "",
          gender: data.gender || "",
          age: data.age ? String(data.age) : "",
          aboutMe: data.aboutMe || "",
          nickname: data.nickname || "",
          profilePhoto: data.profilePhoto || "",
        })

        if (data.profilePhoto) setPhotoPreview(data.profilePhoto)
        setProfileExists(true)
        setShowForm(false)
      }
    } catch (err) {
      setError("Failed to load profile data")
      setProfileExists(false)
      setShowForm(false)
    }
  }

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
  }, [userId])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
        setForm({ ...form, profilePhoto: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage("")
    setError("")
    setLoading(true)

    try {
      const method = profileExists ? "PUT" : "POST"
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...form,
          age: form.age ? Number(form.age) : undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(profileExists ? "Profile updated successfully!" : "Profile created successfully!")
        setIsEditing(false)
        setProfileExists(true)
        setShowForm(false)

        // Re-fetch profile after creation
        if (!profileExists) {
          await fetchProfile()
        }

        // Show the message on the profile card after closing the form
        setTimeout(() => setMessage(""), 3000)
      } else {
        setError(data.message || (profileExists ? "Error updating profile" : "Error creating profile"))
      }
    } catch (err) {
      setError(profileExists ? "Error updating profile" : "Error creating profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Handler for deleting profile
  const handleDelete = async () => {
    if (!userId) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const data = await res.json()

      if (res.ok) {
        navigate("/login")
      } else {
        setError(data.message || "Error deleting profile")
      }
    } catch (err) {
      setError("Error deleting profile")
    } finally {
      setLoading(false)
    }
  }

  // Handler for showing the create profile form
  const handleShowCreate = () => {
    setShowForm(true)
    setError("")
    setMessage("")
    setIsEditing(true)
  }

  // Add this handler for uploading a profile photo
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(URL.createObjectURL(file))
      setShowCropper(true)
    }
  }

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const onCropAndUpload = async () => {
    if (!selectedImage || !croppedAreaPixels || !userId) return

    const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels)
    const formData = new FormData()
    formData.append("profilePhoto", croppedBlob, "cropped.jpg")

    try {
      const res = await fetch(`http://localhost:5000/api/profile/${userId}/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        setPhotoPreview(data.profilePhoto)
        setForm((prev) => ({ ...prev, profilePhoto: data.profilePhoto }))
        setMessage("Profile photo updated!")
        // Immediately re-fetch the profile to reflect changes
        await fetchProfile()
      } else {
        setError(data.message || "Error uploading photo")
      }
    } catch (err) {
      setError("Error uploading photo")
    }

    setShowCropper(false)
    setSelectedImage(undefined)
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            My <span className="text-emerald-600">Profile</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Manage your profile information and connect with fellow Fast University students. Keep your details updated
            to help others find and connect with you.
          </p>
        </div>

        {/* Show message or profile */}
        {!profileExists && !showForm && (
          <div className="text-center mb-8 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-12 mb-8">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-6 animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Profile</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Set up your profile to connect with fellow Fast University students and make meaningful academic
                  connections.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Success message on profile card */}
        {message && !showForm && (
          <div className="mb-6 p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl text-center transform transition-all duration-500 animate-fadeIn shadow-lg">
            <div className="flex items-center justify-center mb-2">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse-slow">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <p className="text-emerald-800 font-bold text-xl">{message}</p>
          </div>
        )}

        {profileExists && !showForm && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-8 transform transition-all duration-500 hover:shadow-2xl animate-fadeIn">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white mb-4 transform transition-all duration-300 group-hover:scale-105">
                    {photoPreview || form.profilePhoto ? (
                      <img
                        src={
                          form.profilePhoto
                            ? form.profilePhoto.startsWith("http")
                              ? form.profilePhoto
                              : `http://localhost:5000${form.profilePhoto}`
                            : "/placeholder.svg"
                        }
                        alt="Profile"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-4xl font-bold">{getInitials(user?.name || "")}</span>
                      </div>
                    )}

                    {/* Enhanced pencil icon for changing photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 hover:rotate-12 group"
                      title="Change Photo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5 text-emerald-600 group-hover:text-emerald-700 transition-colors duration-300"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487a2.1 2.1 0 1 1 2.97 2.97L7.5 19.79l-4 1 1-4 13.362-13.303z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-center text-white space-y-2">
                  <h2 className="text-3xl font-bold mb-2 animate-slideInUp">{user?.name || "Your Name"}</h2>
                  {form.nickname && (
                    <p className="text-emerald-100 text-lg mb-1 animate-slideInUp animation-delay-100">
                      "{form.nickname}"
                    </p>
                  )}
                  <p className="text-emerald-100 mb-4 animate-slideInUp animation-delay-200">{user?.email}</p>

                  <div className="flex flex-wrap justify-center gap-3 text-sm animate-slideInUp animation-delay-300">
                    {form.campus && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105">
                        <span>📍</span>
                        <span>{form.campus}</span>
                      </span>
                    )}
                    {form.batch && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105">
                        <span>🎓</span>
                        <span>Batch {form.batch}</span>
                      </span>
                    )}
                    {form.age && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105">
                        <span>🎂</span>
                        <span>{form.age} years</span>
                      </span>
                    )}
                    {form.gender && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center space-x-2 transform transition-all duration-300 hover:bg-white/30 hover:scale-105">
                        <span>{form.gender === "male" ? "👨" : form.gender === "female" ? "👩" : "👤"}</span>
                        <span className="capitalize">{form.gender}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* About Me Section */}
            {form.aboutMe && (
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  About Me
                </h3>
                <p className="text-gray-700 leading-relaxed">{form.aboutMe}</p>
              </div>
            )}
          </div>
        )}

        {profileExists && !showForm && (
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => {
                setShowForm(true)
                setIsEditing(true)
              }}
              className="group relative px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 transform group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <span>Edit Profile</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-teal-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="group relative px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                <span>{loading ? "Deleting..." : "Delete Profile"}</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-400 to-red-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
          </div>
        )}

        {/* Show form if creating or editing */}
        {showForm && (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-8 animate-slideInUp">
            {/* Enhanced Form Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-12">
              <div className="text-center text-white">
                <h2 className="text-3xl font-bold mb-2">{profileExists ? "Edit Profile" : "Create Profile"}</h2>
                <p className="text-emerald-100 text-lg">
                  {profileExists ? "Update your information" : "Complete your profile setup"}
                </p>
              </div>
            </div>

            <div className="p-8">
              {/* Success/Error Messages */}
              {message && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-fadeIn">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-emerald-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-emerald-700 text-sm font-medium">{message}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fadeIn">
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

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="animate-slideInUp animation-delay-100">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Basic Information</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Campus</label>
                      <select
                        name="campus"
                        value={form.campus}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                      >
                        <option value="">Select Campus</option>
                        <option value="Islamabad">Islamabad</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Peshawar">Peshawar</option>
                        <option value="Multan">Multan</option>
                        <option value="Faisalabad">Faisalabad</option>
                        <option value="Chiniot-Faisalabad">Chiniot-Faisalabad</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Batch</label>
                      <select
                        name="batch"
                        value={form.batch}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                      >
                        <option value="">Select Batch</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                        <option value="2019">2019</option>
                        <option value="2018">2018</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        disabled={!isEditing}
                        min="16"
                        max="100"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                        placeholder="Enter your age"
                      />
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="animate-slideInUp animation-delay-200">
                  <div className="flex items-center mb-6">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Personal Information</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Nickname</label>
                      <input
                        type="text"
                        name="nickname"
                        value={form.nickname}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-emerald-300"
                        placeholder="What do your friends call you?"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">About Me</label>
                      <textarea
                        name="aboutMe"
                        value={form.aboutMe}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed resize-none hover:border-emerald-300"
                        placeholder="Tell others about yourself, your interests, and what you're studying..."
                      />
                    </div>
                  </div>
                </div>

                {/* Enhanced Submit Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t border-gray-200 animate-slideInUp animation-delay-300">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="group relative px-8 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Cancel</span>
                    </div>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center justify-center space-x-2">
                      {loading ? (
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
                          <span>{profileExists ? "Updating..." : "Creating..."}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 transform group-hover:scale-110 transition-transform duration-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>{profileExists ? "Update Profile" : "Create Profile"}</span>
                        </>
                      )}
                    </div>
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-teal-500 blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Always show Create and Delete buttons */}
        <div className="flex justify-center gap-4 mt-8">
          {!profileExists && !showForm && (
            <button
              onClick={handleShowCreate}
              className="group relative px-10 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-emerald-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center justify-center space-x-3">
                <svg
                  className="w-6 h-6 transform group-hover:rotate-12 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Create Profile</span>
              </div>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-400 to-teal-500 blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
            </button>
          )}
        </div>

        {/* Add this input for uploading a profile photo */}
        <input type="file" accept="image/*" ref={fileInputRef} onChange={onSelectFile} className="hidden" />

        {/* Enhanced modal for cropping */}
        {showCropper && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white p-8 rounded-2xl shadow-2xl relative w-[95vw] max-w-lg h-[500px] flex flex-col overflow-visible animate-slideInUp">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Crop Your Photo</h3>
                <p className="text-gray-600 text-sm">Adjust your profile photo to fit perfectly</p>
              </div>

              <div className="relative flex-1 min-h-[300px] bg-gray-100 rounded-xl overflow-hidden">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowCropper(false)
                    setSelectedImage(undefined)
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={onCropAndUpload}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-300"
                >
                  Save Photo
                </button>
              </div>
            </div>
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

export default Profile
