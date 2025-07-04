import Navbar from "./Navbar"
import { useEffect, useRef, useState } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../contexts/SocketContext"

const ROOM_ID = "demo-room"
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" }
  ]
}
type MatchState = "idle" | "searching" | "matched" | "waiting" | "chatting"

const VideoChat = () => {
  const [isRunning, setIsRunning] = useState(false)
  const [connected, setConnected] = useState(false)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [matchState, setMatchState] = useState<MatchState>("idle")
  const [matchPeer, setMatchPeer] = useState<any>(null)
  const [usersInRoom, setUsersInRoom] = useState<{ id: string; name: string; email: string }[]>([])
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null)
  const localVideoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const { user } = useAuth()
  const { socket } = useSocket()
  const [systemMessage, setSystemMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!socket || !user) return
    const userInfo = { id: user._id, name: user.name, email: user.email }
    socket.emit("join-video-chat", userInfo)
    const handleVideoChatUsers = (users: any) => {
      setUsersInRoom(users)
    }
    socket.on("video-chat-users", handleVideoChatUsers)
    return () => {
      socket.emit("leave-video-chat")
      socket.off("video-chat-users", handleVideoChatUsers)
    }
  }, [socket, user])

  useEffect(() => {
    if (!socket) return
    socket.on("video-match-found", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("matched")
      setMatchPeer({ peerId, ...peerInfo })
    })
    socket.on("video-chat-start", ({ peerId, peerInfo }: { peerId: string; peerInfo: any }) => {
      setMatchState("chatting")
      setOtherUser(peerId)
      setConnected(true)
      setIsRunning(true)
    })
    socket.on("video-chat-skip", (data?: { by?: string; name?: string }) => {
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
      socket.emit("start-video-search")
    })
    socket.on("video-chat-ended", (data?: { by?: string; name?: string }) => {
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
    socket.on("video-waiting-peer-response", () => {
      setMatchState("waiting")
    })
    return () => {
      socket.off("video-match-found")
      socket.off("video-chat-start")
      socket.off("video-chat-skip")
      socket.off("video-waiting-peer-response")
      socket.off("video-chat-ended")
    }
  }, [socket])

  useEffect(() => {
    if (!socket || !user) return
    if (matchState !== "chatting" || !otherUser) return
    let isInitiator = false
    if (socket.id && otherUser) {
      isInitiator = socket.id < otherUser
    }
    let peer: RTCPeerConnection
    let localStream: MediaStream
    let cleanup = false
    const setupConnection = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
        localStreamRef.current = localStream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }
        peer = new RTCPeerConnection(ICE_SERVERS)
        peerRef.current = peer
        localStream.getTracks().forEach((track) => peer.addTrack(track, localStream))
        peer.onicecandidate = (event) => {
          if (event.candidate && otherUser) {
            socket.emit("ice-candidate", { candidate: event.candidate, to: otherUser })
          }
        }
        peer.ontrack = (event) => {
          const [remoteStream] = event.streams
          if (remoteVideoRef.current) {
            if (remoteVideoRef.current.srcObject !== remoteStream) {
              remoteVideoRef.current.srcObject = remoteStream
              remoteVideoRef.current.play().catch((e) => {
                if (e.name !== "AbortError") {
                  console.error("[VideoChat] Error playing remote video:", e)
                }
              })
            }
          }
        }
        peer.onconnectionstatechange = () => {
          if (
            peer.connectionState === "disconnected" ||
            peer.connectionState === "failed" ||
            peer.connectionState === "closed"
          ) {
            stopVideoChat()
          }
        }
        if (isInitiator) {
          const offer = await peer.createOffer()
          await peer.setLocalDescription(offer)
          socket.emit("offer", { offer, to: otherUser })
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[VideoChat] Error setting up WebRTC:", err)
      }
    }
    const handleOffer = async ({ offer, from }: { offer: any; from: string }) => {
      if (!peerRef.current) return
      await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(offer))
      const answer = await peerRef.current.createAnswer()
      await peerRef.current.setLocalDescription(answer)
      socket.emit("answer", { answer, to: from })
    }
    const handleAnswer = async ({ answer }: { answer: any }) => {
      if (!peerRef.current) return
      try {
        if (peerRef.current.signalingState !== "stable") {
          await peerRef.current.setRemoteDescription(new window.RTCSessionDescription(answer))
        }
      } catch (e: any) {
        if (e.name !== "InvalidStateError") {
          console.error("[VideoChat] Error setting remote answer:", e)
        }
      }
    }
    const handleIceCandidate = async ({ candidate }: { candidate: any }) => {
      if (!peerRef.current) return
      try {
        await peerRef.current.addIceCandidate(new window.RTCIceCandidate(candidate))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[VideoChat] Failed to add ICE candidate:", err)
      }
    }
    socket.on("offer", handleOffer)
    socket.on("answer", handleAnswer)
    socket.on("ice-candidate", handleIceCandidate)
    setupConnection()
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null
      }
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
    socket.emit("start-video-search")
  }
  const handleUserResponse = (response: "connect" | "skip") => {
    if (!socket) return
    socket.emit("video-user-response", { response })
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
  const stopVideoChat = () => {
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
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null
    }
    if (socket && otherUser) {
      socket.emit("video-chat-ended", { to: otherUser, name: user?.name })
    }
    setSystemMessage("You ended the chat.")
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2 text-center">Video Chat</h1>
        {systemMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <p className="text-red-700 font-medium">{systemMessage}</p>
          </div>
        )}
        <div className="flex flex-col items-center justify-center">
          {matchState === "matched" && matchPeer && (
            <div className="text-center py-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Match Found!</h3>
              <p className="text-gray-600 mb-2">{matchPeer.name}</p>
              <p className="text-sm text-gray-500 mb-6">{matchPeer.email}</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => handleUserResponse("connect")}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  Connect
                </button>
                <button
                  onClick={() => handleUserResponse("skip")}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
          {matchState === "chatting" && (
            <div className="flex flex-col items-center">
              <div className="flex flex-row gap-8 mb-6">
                <div className="flex flex-col items-center">
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-64 h-48 bg-black rounded-lg border" />
                  <span className="mt-2 text-gray-700 font-medium">You</span>
                </div>
                <div className="flex flex-col items-center">
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-64 h-48 bg-black rounded-lg border" />
                  <span className="mt-2 text-gray-700 font-medium">Connected User</span>
                </div>
              </div>
              <button
                onClick={stopVideoChat}
                className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                End Chat
              </button>
            </div>
          )}
          {(matchState === "idle" || matchState === "searching" || matchState === "waiting") && (
            <div className="text-center py-12">
              {matchState === "idle" && (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Connect</h3>
                  <p className="text-gray-600 mb-8">Start a video chat with a random student</p>
                  <button
                    onClick={handleStartSearch}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium mx-auto text-lg"
                  >
                    Start Video Chat
                  </button>
                </>
              )}
              {matchState === "searching" && (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Searching...</h3>
                  <p className="text-gray-600">Looking for someone to chat with</p>
                </>
              )}
              {matchState === "waiting" && (
                <>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Waiting...</h3>
                  <p className="text-gray-600">Waiting for the other user to respond</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoChat 