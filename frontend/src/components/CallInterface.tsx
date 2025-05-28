import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";

interface CallInterfaceProps {
  socket: any;
  username: string;
  targetUser: string;
  onClose: () => void;
}

const Container = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  padding: ${theme.spacing.lg};
  width: 80%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VideoContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  width: 100%;
`;

const VideoWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Video = styled.video`
  width: 100%;
  border-radius: ${theme.borderRadius.medium};
  background-color: ${theme.colors.dark};
`;

const Username = styled.div`
  position: absolute;
  bottom: ${theme.spacing.sm};
  left: ${theme.spacing.sm};
  background-color: rgba(0, 0, 0, 0.5);
  color: ${theme.colors.background};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.small};
  font-family: ${theme.fonts.primary};
`;

const Controls = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
`;

const ControlButton = styled.button<{ isActive?: boolean; isEnd?: boolean }>`
  background-color: ${(props) =>
    props.isEnd
      ? theme.colors.error
      : props.isActive
      ? theme.colors.success
      : theme.colors.dark};
  color: ${theme.colors.background};
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const CallInterface: React.FC<CallInterfaceProps> = ({
  socket,
  username,
  targetUser,
  onClose,
}) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });
        peerConnection.current = pc;

        // Add local stream to peer connection
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle incoming tracks
        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call_user", {
          caller: username,
          callee: targetUser,
          offer: offer,
        });

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice_candidate", {
              target: targetUser,
              candidate: event.candidate,
            });
          }
        };
      } catch (error) {
        console.error("Error initializing call:", error);
        onClose();
      }
    };

    initializeCall();

    // Clean up
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on(
      "call_accepted",
      async (data: { answer: RTCSessionDescriptionInit }) => {
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(data.answer);
        }
      }
    );

    socket.on(
      "ice_candidate",
      async (data: { candidate: RTCIceCandidateInit }) => {
        if (peerConnection.current) {
          await peerConnection.current.addIceCandidate(data.candidate);
        }
      }
    );

    socket.on("call_rejected", () => {
      onClose();
    });

    socket.on("call_ended", () => {
      onClose();
    });

    return () => {
      socket.off("call_accepted");
      socket.off("ice_candidate");
      socket.off("call_rejected");
      socket.off("call_ended");
    };
  }, [socket]);

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  };

  const handleEndCall = () => {
    socket.emit("end_call", { target: targetUser });
    onClose();
  };

  return (
    <Container>
      <VideoContainer>
        <VideoWrapper>
          <Video ref={localVideoRef} autoPlay muted playsInline />
          <Username>{username} (Sen)</Username>
        </VideoWrapper>
        <VideoWrapper>
          <Video ref={remoteVideoRef} autoPlay playsInline />
          <Username>{targetUser}</Username>
        </VideoWrapper>
      </VideoContainer>
      <Controls>
        <ControlButton onClick={toggleAudio} isActive={isAudioEnabled}>
          {isAudioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </ControlButton>
        <ControlButton onClick={toggleVideo} isActive={isVideoEnabled}>
          {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
        </ControlButton>
        <ControlButton onClick={handleEndCall} isEnd>
          <FaPhoneSlash />
        </ControlButton>
      </Controls>
    </Container>
  );
};

export default CallInterface;
