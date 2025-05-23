import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";

interface FriendRequestsProps {
  socket: any;
  username: string;
  onClose: () => void;
}

const Container = styled.div`
  background-color: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.large};
  width: 100%;
  max-width: 400px;
`;

const Title = styled.h2`
  color: ${theme.colors.primary};
  font-family: ${theme.fonts.primary};
  margin-bottom: ${theme.spacing.lg};
  text-align: center;
`;

const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const RequestItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.light};
  border-radius: ${theme.borderRadius.small};
`;

const Username = styled.span`
  color: ${theme.colors.text};
  font-family: ${theme.fonts.primary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
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
`;

const CloseButton = styled.button`
  position: absolute;
  top: ${theme.spacing.md};
  right: ${theme.spacing.md};
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${theme.colors.textLight};
  cursor: pointer;
  padding: ${theme.spacing.xs};

  &:hover {
    color: ${theme.colors.text};
  }
`;

const EmptyMessage = styled.p`
  color: ${theme.colors.textLight};
  text-align: center;
  font-family: ${theme.fonts.primary};
  margin: ${theme.spacing.lg} 0;
`;

const FriendRequests: React.FC<FriendRequestsProps> = ({
  socket,
  username,
  onClose,
}) => {
  const [requests, setRequests] = useState<string[]>([]);

  useEffect(() => {
    // Get initial friend requests
    socket.emit("get_friend_requests", { username });

    // Listen for friend requests list
    socket.on("friend_requests_list", (data: { requests: string[] }) => {
      setRequests(data.requests);
    });

    // Listen for new friend requests
    socket.on("friend_request_received", (data: { from: string }) => {
      setRequests((prev) => [...prev, data.from]);
    });

    // Clean up listeners
    return () => {
      socket.off("friend_requests_list");
      socket.off("friend_request_received");
    };
  }, [socket, username]);

  const handleAccept = (fromUser: string) => {
    socket.emit("accept_friend_request", {
      from: fromUser,
      to: username,
    });
    setRequests((prev) => prev.filter((user) => user !== fromUser));
  };

  const handleReject = (fromUser: string) => {
    socket.emit("reject_friend_request", {
      from: fromUser,
      to: username,
    });
    setRequests((prev) => prev.filter((user) => user !== fromUser));
  };

  return (
    <Container>
      <CloseButton onClick={onClose}>&times;</CloseButton>
      <Title>Arkadaşlık İstekleri</Title>
      <RequestList>
        {requests.length === 0 ? (
          <EmptyMessage>Bekleyen arkadaşlık isteği yok</EmptyMessage>
        ) : (
          requests.map((request) => (
            <RequestItem key={request}>
              <Username>{request}</Username>
              <ButtonGroup>
                <Button variant="accept" onClick={() => handleAccept(request)}>
                  Kabul Et
                </Button>
                <Button variant="reject" onClick={() => handleReject(request)}>
                  Reddet
                </Button>
              </ButtonGroup>
            </RequestItem>
          ))
        )}
      </RequestList>
    </Container>
  );
};

export default FriendRequests;
