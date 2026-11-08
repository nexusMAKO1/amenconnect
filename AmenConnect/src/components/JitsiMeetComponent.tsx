import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface ConferenceConfig {
  provider: string;
  domain: string;
  tenant: string | null;
  roomId: string;
  token: string | null;
  displayName: string;
  email: string;
  isModerator: boolean;
}

const JitsiMeetComponent: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const secureRoomName = (roomId || "default-room").replace(/[^a-zA-Z0-9_-]/g, "");

  const [config, setConfig] = useState<ConferenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchConferenceToken() {
      try {
        setLoading(true);
        const res = await fetch(`/api/video-requests/token?roomId=${encodeURIComponent(secureRoomName)}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Impossible de récupérer la configuration de la conférence");
        const data: ConferenceConfig = await res.json();
        if (isMounted) {
          setConfig(data);
          setError(null);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Erreur de configuration");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchConferenceToken();
    return () => {
      isMounted = false;
    };
  }, [secureRoomName]);

  if (loading) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p>Connexion sécurisée à la visioconférence...</p>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#ff4961" }}>{error || "Erreur de chargement"}</p>
      </div>
    );
  }

  // Build the conference URL based on server-provided provider & tokens
  const baseUrl = config.tenant
    ? `https://${config.domain}/${config.tenant}/${config.roomId}`
    : `https://${config.domain}/${config.roomId}`;

  const hashParams =
    `#config.prejoinPageEnabled=false` +
    `&config.startWithAudioMuted=false` +
    `&config.startWithVideoMuted=false` +
    `&config.subject=${encodeURIComponent("Amen Bank Visioconférence")}` +
    `&userInfo.displayName=${encodeURIComponent(config.displayName)}` +
    `&userInfo.email=${encodeURIComponent(config.email)}` +
    `&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","closedcaptions","desktop","fullscreen","fodeviceselection","hangup","chat"${config.isModerator ? ',"recording"' : ""}]`;

  const jitsiUrl = config.token ? `${baseUrl}?jwt=${config.token}${hashParams}` : `${baseUrl}${hashParams}`;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <iframe
        src={jitsiUrl}
        style={{ width: "100%", height: "100%", border: "0" }}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        title="Video Conference"
      />
    </div>
  );
};

export default JitsiMeetComponent;
