import React, {
  useEffect,
  useRef,
  useState,
  ButtonHTMLAttributes,
} from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";
import { translationService } from "../services/translationService";

interface CallInterfaceProps {
  socket: any;
  username: string;
  targetUser: string;
  onClose: () => void;
}

const Container = styled.div`
  position: fixed;
  bottom: ${theme.spacing.lg};
  right: ${theme.spacing.lg};
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  width: 300px;
  z-index: 1000;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.md};
`;

const Title = styled.h3`
  margin: 0;
  color: ${theme.colors.text};
  font-family: ${theme.fonts.primary};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${theme.colors.textLight};
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${theme.colors.text};
  }
`;

const CallStatus = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.md};
  color: ${theme.colors.text};
  font-family: ${theme.fonts.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  justify-content: center;
`;

const Button = styled.button<{ variant?: "accept" | "reject" }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: none;
  border-radius: ${theme.borderRadius.small};
  background-color: ${(props) =>
    props.variant === "accept"
      ? theme.colors.success
      : props.variant === "reject"
      ? theme.colors.error
      : theme.colors.primary};
  color: ${theme.colors.background};
  font-family: ${theme.fonts.primary};
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    background-color: ${theme.colors.textLight};
    cursor: not-allowed;
  }
`;

const AudioControls = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
`;

const AudioButton = styled.button<{ active?: boolean; variant?: "reject" }>`
  padding: ${theme.spacing.sm};
  border: none;
  border-radius: 50%;
  background-color: ${(props) =>
    props.active
      ? theme.colors.error
      : props.variant === "reject"
      ? theme.colors.error
      : theme.colors.primary};
  color: ${theme.colors.background};
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const TranslationSettings = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
`;

const LanguageSelect = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.small};
  background-color: ${theme.colors.background};
  color: ${theme.colors.text};
`;

interface TranslationToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

const TranslationToggle = styled.button<TranslationToggleProps>`
  padding: ${theme.spacing.sm};
  margin-top: ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.small};
  background-color: ${(props) =>
    props.active ? theme.colors.primary : theme.colors.background};
  color: ${(props) =>
    props.active ? theme.colors.background : theme.colors.text};
  cursor: pointer;
`;

const TranslationStatus = styled.p`
  font-size: 0.8rem;
  color: ${theme.colors.textLight};
  text-align: center;
  margin: ${theme.spacing.sm} 0 0;
`;

type CallState =
  | "initiating"
  | "incoming"
  | "connecting"
  | "connected"
  | "ended";

// WebRTC yapılandırması
const configuration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const CallInterface: React.FC<CallInterfaceProps> = ({
  socket,
  username,
  targetUser,
  onClose,
}) => {
  const [callState, setCallState] = useState<CallState>("initiating");
  const [isMuted, setIsMuted] = useState(false);
  const [speakLanguage, setSpeakLanguage] = useState("en");
  const [hearLanguage, setHearLanguage] = useState("en");
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(true);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // WebRTC yapılandırması
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    };

    // Gelen arama dinleyicisi
    socket.on(
      "incoming_call",
      async (data: { caller: string; offer: RTCSessionDescriptionInit }) => {
        if (data.caller === targetUser) {
          setCallState("incoming");
          peerConnectionRef.current = new RTCPeerConnection(configuration);
          setupPeerConnectionListeners();

          try {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.offer)
            );
            const answer = await peerConnectionRef.current.createAnswer();
            await peerConnectionRef.current.setLocalDescription(answer);

            socket.emit("call_response", {
              caller: targetUser,
              accepted: true,
              answer: answer,
            });

            setCallState("connecting");
          } catch (error) {
            console.error("Error handling incoming call:", error);
            handleEndCall();
          }
        }
      }
    );

    // Arama yanıtı dinleyicisi
    socket.on(
      "call_accepted",
      async (data: { answer: RTCSessionDescriptionInit }) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(
              new RTCSessionDescription(data.answer)
            );
            setCallState("connected");
          }
        } catch (error) {
          console.error("Error handling call accept:", error);
          handleEndCall();
        }
      }
    );

    // Arama reddetme dinleyicisi
    socket.on("call_rejected", () => {
      handleEndCall();
    });

    // ICE adayı dinleyicisi
    socket.on(
      "ice_candidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        try {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          }
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    );

    // Arama sonlandırma dinleyicisi
    socket.on("call_ended", handleEndCall);

    // Aramayı başlat
    if (callState === "initiating") {
      initiateCall();
    }

    return () => {
      socket.off("incoming_call");
      socket.off("call_accepted");
      socket.off("call_rejected");
      socket.off("ice_candidate");
      socket.off("call_ended");
      handleEndCall();
    };
  }, []);

  useEffect(() => {
    if (callState === "connected" && isTranslationEnabled) {
      setupMediaRecorder();
    }
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [callState, isTranslationEnabled]);

  const setupPeerConnectionListeners = () => {
    if (!peerConnectionRef.current) return;

    peerConnectionRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", {
          target: targetUser,
          candidate: event.candidate,
        });
      }
    };

    peerConnectionRef.current.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
      }
    };
  };

  const initiateCall = async () => {
    try {
      // Mikrofon erişimi iste
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // WebRTC bağlantısını kur
      peerConnectionRef.current = new RTCPeerConnection(configuration);
      setupPeerConnectionListeners();

      // Yerel ses akışını ekle
      stream.getTracks().forEach((track) => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addTrack(track, stream);
        }
      });

      // Teklif oluştur
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      // Teklifi karşı tarafa gönder
      socket.emit("call_user", {
        caller: username,
        callee: targetUser,
        offer: offer,
      });

      setCallState("connecting");
    } catch (error) {
      console.error("Error initiating call:", error);
      handleEndCall();
    }
  };

  const handleAcceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      if (peerConnectionRef.current) {
        stream.getTracks().forEach((track) => {
          if (peerConnectionRef.current) {
            peerConnectionRef.current.addTrack(track, stream);
          }
        });
      }

      setCallState("connected");
    } catch (error) {
      console.error("Error accepting call:", error);
      handleEndCall();
    }
  };

  const handleRejectCall = () => {
    socket.emit("call_response", {
      caller: targetUser,
      accepted: false,
    });
    handleEndCall();
  };

  const handleEndCall = () => {
    // Yerel medya akışını durdur
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Uzak medya akışını durdur
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    // WebRTC bağlantısını kapat
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Socket'e bildir
    socket.emit("end_call", {
      target: targetUser,
    });

    setCallState("ended");
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const getCallStatusText = () => {
    switch (callState) {
      case "initiating":
        return `${targetUser} aranıyor...`;
      case "incoming":
        return `${targetUser} arıyor...`;
      case "connecting":
        return "Bağlanıyor...";
      case "connected":
        return `${targetUser} ile görüşme devam ediyor`;
      case "ended":
        return "Görüşme sonlandı";
      default:
        return "";
    }
  };

  const setupMediaRecorder = async () => {
    if (!localStreamRef.current) return;

    const mediaRecorder = new MediaRecorder(localStreamRef.current);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);

        // Her 2 saniyede bir konuşmayı işle
        if (audioChunksRef.current.length >= 2) {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });
          const arrayBuffer = await audioBlob.arrayBuffer();

          try {
            // Konuşmayı metne çevir
            const text = await translationService.speechToText(
              arrayBuffer,
              speakLanguage
            );

            if (text) {
              // Metni hedef dile çevir
              const translatedText = await translationService.translateText(
                text,
                speakLanguage,
                hearLanguage
              );

              // Çevrilmiş metni sese çevir
              const translatedAudio = await translationService.textToSpeech(
                translatedText,
                hearLanguage
              );

              // Çevrilmiş sesi karşı tarafa gönder
              socket.emit("translated_audio", {
                target: targetUser,
                audio: translatedAudio,
              });
            }
          } catch (error) {
            console.error("Translation process error:", error);
          }

          // Audio chunks'ları temizle
          audioChunksRef.current = [];
        }
      }
    };

    mediaRecorder.start(1000); // Her saniye bir veri topla
  };

  // Socket dinleyicilerini ekle
  useEffect(() => {
    socket.on("translated_audio", async (data: { audio: ArrayBuffer }) => {
      try {
        // Gelen ses verisini oynat
        const audioBlob = new Blob([data.audio], { type: "audio/mp3" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        await audio.play();
      } catch (error) {
        console.error("Error playing translated audio:", error);
      }
    });

    return () => {
      socket.off("translated_audio");
    };
  }, [socket]);

  return (
    <Container>
      <Header>
        <Title>Sesli Görüşme</Title>
        <CloseButton onClick={handleEndCall}>&times;</CloseButton>
      </Header>

      <CallStatus>{getCallStatusText()}</CallStatus>

      {callState === "incoming" && (
        <ButtonGroup>
          <Button variant="accept" onClick={handleAcceptCall}>
            Kabul Et
          </Button>
          <Button variant="reject" onClick={handleRejectCall}>
            Reddet
          </Button>
        </ButtonGroup>
      )}

      {callState === "connected" && (
        <>
          <AudioControls>
            <AudioButton active={isMuted} onClick={toggleMute}>
              {isMuted ? "🔇" : "🔊"}
            </AudioButton>
            <AudioButton variant="reject" onClick={handleEndCall}>
              📞
            </AudioButton>
          </AudioControls>

          <TranslationSettings>
            <LanguageSelect
              value={speakLanguage}
              onChange={(e) => setSpeakLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="tr">Turkish</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </LanguageSelect>

            <LanguageSelect
              value={hearLanguage}
              onChange={(e) => setHearLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="tr">Turkish</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </LanguageSelect>

            <TranslationToggle
              active={isTranslationEnabled}
              onClick={() => setIsTranslationEnabled(!isTranslationEnabled)}
            >
              {isTranslationEnabled ? "Çeviriyi Kapat" : "Çeviriyi Aç"}
            </TranslationToggle>

            {isTranslationEnabled && (
              <TranslationStatus>
                Çeviri görüşmede gecikmeye neden olabilir
              </TranslationStatus>
            )}
          </TranslationSettings>
        </>
      )}

      <audio ref={audioRef} autoPlay />
    </Container>
  );
};

export default CallInterface;
