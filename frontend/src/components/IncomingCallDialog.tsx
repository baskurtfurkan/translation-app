import React, { useRef } from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";
import { FaPhone, FaPhoneSlash } from "react-icons/fa";

interface IncomingCallDialogProps {
  socket: any;
  callerUsername: string;
  offer: RTCSessionDescriptionInit;
  onAccept: () => void;
  onReject: () => void;
}

const Container = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  padding: 20px;
  width: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Title = styled.h3`
  margin: 0;
  color: ${theme.colors.text};
  text-align: center;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
`;

const Button = styled.button<{ isAccept?: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  background-color: ${(props) =>
    props.isAccept ? theme.colors.success : theme.colors.error};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 20px;

  &:hover {
    transform: scale(1.1);
  }
`;

const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  socket,
  callerUsername,
  offer,
  onAccept,
  onReject,
}) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const setupPeerConnection = async () => {
    try {
      // Eğer önceki bağlantı varsa kapat
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }

      // Yeni bağlantı oluştur
      const configuration = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      };
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Medya stream'ini al
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Track'leri ekle
      stream.getTracks().forEach((track) => {
        if (peerConnection.signalingState !== "closed") {
          peerConnection.addTrack(track, stream);
        }
      });

      // ICE adaylarını dinle
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice_candidate", {
            target: callerUsername,
            candidate: event.candidate,
          });
        }
      };

      // Remote description'ı ayarla
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Answer oluştur
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      return answer;
    } catch (error) {
      console.error("Peer bağlantısı kurulurken hata:", error);
      throw error;
    }
  };

  const handleAccept = async () => {
    try {
      const answer = await setupPeerConnection();
      socket.emit("call_response", {
        caller: callerUsername,
        accepted: true,
        answer: answer,
      });
      onAccept();
    } catch (error) {
      console.error("Arama kabul edilirken hata:", error);
      onReject();
    }
  };

  const handleReject = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    socket.emit("call_response", {
      caller: callerUsername,
      accepted: false,
    });
    onReject();
  };

  return (
    <Container>
      <Title>{callerUsername} sizi arıyor...</Title>
      <ButtonContainer>
        <Button onClick={handleReject}>
          <FaPhoneSlash />
        </Button>
        <Button isAccept onClick={handleAccept}>
          <FaPhone />
        </Button>
      </ButtonContainer>
    </Container>
  );
};

export default IncomingCallDialog;
