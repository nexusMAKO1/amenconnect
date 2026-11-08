"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"

interface JitsiMeetComponentProps {
  roomName: string
  displayName?: string
  email?: string
  subject?: string
  width?: string
  height?: string
  onApiReady?: (api: any) => void
  onClose?: () => void
}

const JitsiMeetComponent: React.FC<JitsiMeetComponentProps> = ({
  roomName,
  displayName = "Admin",
  email = "",
  subject = "Video Conference",
  width = "100%",
  height = "100%",
  onApiReady,
  onClose,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jitsiUrl, setJitsiUrl] = useState<string>("")

  // Generate a secure room name if not provided
  const secureRoomName = (roomName || `secure-${Math.random().toString(36).substring(2, 15)}`).replace(/[^a-zA-Z0-9_-]/g, "")

  useEffect(() => {
    let isMounted = true
    async function loadConferenceConfig() {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/video-requests/token?roomId=${encodeURIComponent(secureRoomName)}`, {
          credentials: "include",
        })
        if (!response.ok) throw new Error("Échec de récupération de la session de visioconférence")
        const config = await response.json()

        const baseUrl = config.tenant
          ? `https://${config.domain}/${config.tenant}/${config.roomId}`
          : `https://${config.domain}/${config.roomId}`

        const hashParams =
          `#config.prejoinPageEnabled=false` +
          `&config.startWithAudioMuted=false` +
          `&config.startWithVideoMuted=false` +
          `&config.subject=${encodeURIComponent(subject)}` +
          `&userInfo.displayName=${encodeURIComponent(displayName || config.displayName)}` +
          `&userInfo.email=${encodeURIComponent(email || config.email)}` +
          `&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","profile","chat","recording","settings","raisehand","tileview","mute-everyone","security"]` +
          `&interfaceConfig.SETTINGS_SECTIONS=["devices","language","moderator","profile"]` +
          `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
          `&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false` +
          `&interfaceConfig.SHOW_BRAND_WATERMARK=false`

        const fullUrl = config.token ? `${baseUrl}?jwt=${config.token}${hashParams}` : `${baseUrl}${hashParams}`

        if (isMounted) {
          setJitsiUrl(fullUrl)
          setError(null)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Erreur lors du chargement de la visioconférence")
          setIsLoading(false)
        }
      }
    }

    loadConferenceConfig()

    return () => {
      isMounted = false
    }
  }, [secureRoomName, displayName, email, subject])

  useEffect(() => {
    // Handle iframe load events
    const handleIframeLoad = () => {
      setIsLoading(false)
    }

    // Handle iframe error events
    const handleIframeError = () => {
      setError("Failed to load Jitsi Meet")
      setIsLoading(false)
    }

    // Add event listeners to the iframe
    const iframe = iframeRef.current
    if (iframe) {
      iframe.addEventListener("load", handleIframeLoad)
      iframe.addEventListener("error", handleIframeError)
    }

    // Set up a message listener for communication from the Jitsi iframe
    const handleMessage = (event: MessageEvent) => {
      // Ensure the message comes from the expected JaaS domain
      if (!event.origin.includes("8x8.vc")) return

      try {
        const data = JSON.parse(event.data)
        // Handle specific events from Jitsi (e.g., conference end)
        if (data.event === "videoConferenceLeft" || data.event === "readyToClose") {
          if (onClose) onClose()
        }
        console.log("Jitsi event:", data)
      } catch (e) {
        // Not a JSON message or other error; ignore.
      }
    }

    window.addEventListener("message", handleMessage)

    // Clean up event listeners on component unmount
    return () => {
      if (iframe) {
        iframe.removeEventListener("load", handleIframeLoad)
        iframe.removeEventListener("error", handleIframeError)
      }
      window.removeEventListener("message", handleMessage)
    }
  }, [onClose])

  // Retry loading the iframe on error
  const handleRetry = () => {
    setIsLoading(true)
    setError(null)
    if (iframeRef.current) {
      const src = iframeRef.current.src
      iframeRef.current.src = ""
      setTimeout(() => {
        if (iframeRef.current) iframeRef.current.src = src
      }, 100)
    }
  }

  return (
    <div style={{ position: "relative", height, width }}>
      {isLoading && (
        <div className="jitsi-loading">
          <div className="jitsi-loading-spinner"></div>
          <p>Chargement de la visioconférence...</p>
        </div>
      )}

      {error && (
        <div className="jitsi-error">
          <div className="jitsi-error-icon"></div>
          <p>{error}</p>
          <button className="jitsi-retry-button" onClick={handleRetry}>
            Réessayer
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={jitsiUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "0",
          display: isLoading || error ? "none" : "block",
        }}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        allowFullScreen
        title="Video Conference"
      />
    </div>
  )
}

export default JitsiMeetComponent
