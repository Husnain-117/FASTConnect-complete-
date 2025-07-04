"use client"

import Navbar from "./Navbar"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../contexts/SocketContext"
import { Mic, Phone, PhoneOff, Users, Search, SkipForward, Volume2 } from "lucide-react"

const ROOM_ID = "demo-room"
const ICE_SERVERS = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }

type MatchState = "idle" | "searching" | "matched" | "waiting" | "chatting"

const VoiceChat = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [matchState, setMatchState] = useState<MatchState>("idle")
  const [matchPeer, setMatchPeer] = useState<any>(null)
  const [usersInRoom, setUsersInRoom] = useState<{ id: string; name: string; email: string }[]>([])
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const { user } = useAuth()
  const { socket } = useSocket()
  const [systemMessage, setSystemMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!socket || !user) return
    const userInfo = { id: user._id, name: user.name, email: user.email }
    socket.emit("join-voice-chat", userInfo)

    const handleVoiceChatUsers = (users: any) => {
      setUsersInRoom(users)
    }

    socket.on("voice-chat-users", handleVoiceChatUsers)

    return () => {
      socket.emit("leave-voice-chat")
      socket.off("voice-chat-users", handleVoiceChatUsers)
    }
  }, [socket, user])

  useEffect(() => {
    if (!socket) return

    socket.on("match-found", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("matched")
      setMatchPeer({ peerId, ...peerInfo })
    })

    socket.on("chat-start", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setConnected(true)
      setIsRunning(true)
    })

    socket.on("chat-skip", (data?: { by?: string; name?: string }) => {
      setMatchState("searching")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      if (data && data.name) {
        setSystemMessage(`${data.name} skipped the chat.`)
      } else {
        setSystemMessage("The other user skipped the chat.")
      }
      socket.emit("start-search")
    })

    socket.on("chat-ended", (data?: { by?: string; name?: string }) => {
      setMatchState("idle")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
      if (data && data.name) {
        setSystemMessage(`${data.name} ended the chat.`)
      } else {
        setSystemMessage("The other user ended the chat.")
      }
    })

    socket.on("waiting-peer-response", () => {
      setMatchState("waiting")
    })

    return () => {
      socket.off("match-found")
      socket.off("chat-start")
      socket.off("chat-skip")
      socket.off("waiting-peer-response")
      socket.off("chat-ended")
    }
  }, [socket])

  // --- WebRTC setup for random matching ---
  useEffect(() => {
    if (!socket || !user) return
    if (matchState !== "chatting" || !otherUser) return

    let isInitiator = false
    if (socket.id && otherUser) {
      // Use lexicographical order to decide initiator
      isInitiator = socket.id < otherUser
    }

    console.debug(
      "[VoiceChat] WebRTC setup: matchState=chatting, my socket.id:",
      socket.id,
      "otherUser:",
      otherUser,
      "isInitiator:",
      isInitiator,
    )

    let peer: RTCPeerConnection
    let localStream: MediaStream
    let cleanup = false

    const setupConnection = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        localStreamRef.current = localStream
        console.debug("[VoiceChat] Got local audio stream:", localStream)

        peer = new RTCPeerConnection(ICE_SERVERS)
        peerRef.current = peer

        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream))
        console.debug("[VoiceChat] Added local tracks to RTCPeerConnection")

        peer.onicecandidate = (event) => {
          if (event.candidate && otherUser) {
            console.debug("[VoiceChat] Sending ICE candidate to", otherUser, event.candidate)
            socket.emit("ice-candidate", { candidate: event.candidate, to: otherUser })
          }
        }

        peer.ontrack = (event) => {
          const [remoteStream] = event.streams
          console.debug("[VoiceChat] Received remote track:", remoteStream)
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream
            remoteAudioRef.current.play().catch((e) => console.error("[VoiceChat] Error playing audio:", e))
          }
        }

        peer.onconnectionstatechange = () => {
          console.debug("[VoiceChat] Peer connection state:", peer.connectionState)
          if (
            peer.connectionState === "disconnected" ||
            peer.connectionState === "failed" ||
            peer.connectionState === "closed"
          ) {
            stopVoiceChat()
          }
        }

        // Initiator creates offer
        if (isInitiator) {
          const offer = await peer.createOffer()
          await peer.setLocalDescription(offer)
          console.debug("[VoiceChat] Created and set local offer, sending to", otherUser, offer)
          socket.emit("offer", { offer, to: otherUser })
        }
      } catch (err) {
        console.error("[VoiceChat] Error setting up WebRTC:", err)
      }
    }

    // --- Signaling event handlers ---
    const handleOffer = async ({ offer, from }: { offer: any; from: string }) => {
      console.debug("[VoiceChat] Received offer from", from, offer)
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(offer))
      const answer = await peerRef.current.createAnswer()
      await peerRef.current.setLocalDescription(answer)
      console.debug("[VoiceChat] Created and set local answer, sending to", from, answer)
      socket.emit("answer", { answer, to: from })
    }

    const handleAnswer = async ({ answer }: { answer: any }) => {
      console.debug("[VoiceChat] Received answer", answer)
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(answer))
    }

    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      console.debug("[VoiceChat] Received ICE candidate", candidate)
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new window.RTCIceCandidate(candidate))
      } catch (err) {
        console.error("[VoiceChat] Failed to add ICE candidate:", err)
      }
    }

    // Register signaling handlers
    socket.on("offer", handleOffer)
    socket.on("answer", handleAnswer)
    socket.on("ice-candidate", handleIceCandidate)

    setupConnection()

    // Cleanup on unmount or when chat ends
    return () => {
      cleanup = true
      socket.off("offer", handleOffer)
      socket.off("answer", handleAnswer)
      socket.off("ice-candidate", handleIceCandidate)

      if (peerRef.current) {
        peerRef.current.close()
        peerRef.current = null
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null
      }
      console.debug("[VoiceChat] Cleaned up WebRTC connection")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchState, otherUser])

  const handleStartSearch = () => {
    if (!socket || matchState === "searching" || matchState === "chatting") return
    setMatchState("searching")
    setMatchPeer(null)
    setOtherUser(null)
    setConnected(false)
    setIsRunning(false)
    socket.emit("start-search")
  }

  const handleUserResponse = (response: "connect" | "skip") => {
    if (!socket) return
    socket.emit("user-response", { response })
    if (response === "skip") {
      setMatchState("searching")
      setMatchPeer(null)
      setOtherUser(null)
      setConnected(false)
      setIsRunning(false)
    } else {
      setMatchState("waiting")
    }
  }

  const stopVoiceChat = () => {
    setIsRunning(false)
    setConnected(false)
    setOtherUser(null)
    setMatchState("idle")
    setMatchPeer(null)

    if (peerRef.current) {
      peerRef.current.close()
      peerRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }

    if (socket && otherUser) {
      socket.emit("chat-ended", { to: otherUser, name: user?.name })
    }
    setSystemMessage("You ended the chat.")
  }

  const getStatusColor = () => {
    switch (matchState) {
      case "searching":
        return "text-amber-600"
      case "matched":
        return "text-emerald-600"
      case "chatting":
        return "text-emerald-600"
      case "waiting":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getStatusText = () => {
    switch (matchState) {
      case "searching":
        return "Searching for a match..."
      case "matched":
        return "Match found!"
      case "chatting":
        return "Connected"
      case "waiting":
        return "Waiting for response..."
      default:
        return "Ready to connect"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />

      {/* Header Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-xl mb-3">
              <Volume2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fast Connect Voice Chat</h1>
            <p className="text-gray-600">Connect and communicate with fellow Fast University students in real-time.</p>
            <p className="text-gray-500 text-sm mt-1">
              Share ideas, collaborate on projects, and build lasting academic relationships.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium">Voice Chat</button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Available Users
          </button>
          <button className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
            Chat History
          </button>
          <div className="flex items-center space-x-2 text-sm text-gray-500 ml-4">
            <Users className="w-4 h-4" />
            <span>{usersInRoom.length} users online</span>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Chat Header */}
          <div className="bg-emerald-500 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">University Voice Chat</h2>
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    matchState === "chatting"
                      ? "bg-green-300"
                      : matchState === "searching"
                        ? "bg-yellow-300"
                        : "bg-gray-300"
                  }`}
                ></div>
                <span className="text-sm">{getStatusText()}</span>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="h-96 overflow-y-auto bg-gray-50 p-4">
            {/* System Message */}
            {systemMessage && (
              <div className="mb-4 text-center">
                <div className="inline-block bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">{systemMessage}</div>
              </div>
            )}

            {/* Chat States */}
            {matchState === "idle" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mic className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Connect</h3>
                <p className="text-gray-600 text-sm mb-6">Start a voice chat with a random student</p>
                <button
                  onClick={handleStartSearch}
                  className="flex items-center space-x-2 px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium mx-auto"
                >
                  <Search className="w-4 h-4" />
                  <span>Start Voice Chat</span>
                </button>
              </div>
            )}

            {matchState === "searching" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-amber-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Searching...</h3>
                <p className="text-gray-600 text-sm">Looking for someone to chat with</p>
                <div className="flex justify-center mt-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            {matchState === "matched" && matchPeer && (
              <div className="space-y-4">
                {/* System message */}
                <div className="text-center">
                  <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    Match found! You've been connected with {matchPeer.name}
                  </div>
                </div>

                {/* Match card */}
                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-emerald-600 font-semibold">{matchPeer.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{matchPeer.name}</p>
                      <p className="text-sm text-gray-500">{matchPeer.email}</p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleUserResponse("connect")}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      <span>Connect</span>
                    </button>
                    <button
                      onClick={() => handleUserResponse("skip")}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Skip</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {matchState === "waiting" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiting...</h3>
                <p className="text-gray-600 text-sm">Waiting for the other user to respond</p>
              </div>
            )}

            {matchState === "chatting" && (
              <div className="space-y-4">
                {/* Connection established message */}
                <div className="text-center">
                  <div className="inline-block bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm">
                    Voice chat connected! You can now talk.
                  </div>
                </div>

                {/* Voice indicators */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-emerald-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center relative">
                        <Mic className="w-5 h-5 text-emerald-600" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">You</p>
                        <p className="text-xs text-gray-500">Speaking</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center relative">
                        <Volume2 className="w-5 h-5 text-blue-600" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Connected User</p>
                        <p className="text-xs text-gray-500">Listening</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* End chat button */}
                <div className="text-center pt-4">
                  <button
                    onClick={stopVoiceChat}
                    className="flex items-center space-x-2 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium mx-auto"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Chat</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Input Area (for consistency with chat design) */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2">
                <span className="text-gray-500 text-sm">Voice chat active - speak to communicate</span>
              </div>
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Mic className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Online Users Sidebar */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Users</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {usersInRoom.map((u) => (
              <div key={u.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 font-medium text-sm">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Guidelines */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Chat Guidelines</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">01</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Be Respectful</h4>
              <p className="text-sm text-gray-600">
                Treat all students with respect and maintain professional communication standards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">02</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Academic Focus</h4>
              <p className="text-sm text-gray-600">
                Keep conversations academic and educational to help everyone learn and grow together.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-emerald-600 font-bold">03</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Stay Safe</h4>
              <p className="text-sm text-gray-600">
                Never share personal information and report any inappropriate behavior immediately.
              </p>
            </div>
          </div>
        </div>

        {/* Audio Debug (hidden by default) */}
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6" style={{ display: "none" }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Audio Debug</h3>
          <audio ref={remoteAudioRef} autoPlay controls className="w-full" />
        </div>
      </div>
    </div>
  )
}

export default VoiceChat
