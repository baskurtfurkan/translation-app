import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { theme } from "../styles/theme";
import CallInterface from "./CallInterface";
import IncomingCallDialog from "./IncomingCallDialog";

const Container = styled.div`
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.medium};
  box-shadow: ${theme.shadows.medium};
  width: 300px;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  padding: ${theme.spacing.md};
  border-top-left-radius: ${theme.borderRadius.medium};
  border-top-right-radius: ${theme.borderRadius.medium};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-family: ${theme.fonts.primary};
  font-size: 1.2rem;
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${theme.spacing.md};
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  padding: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.small};
  background-color: ${theme.colors.background};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${theme.colors.light};
  }
`;

const OnlineStatus = styled.div<{ isOnline: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.isOnline ? theme.colors.success : theme.colors.textLight};
  margin-right: ${theme.spacing.sm};
`;

const Username = styled.span`
  font-family: ${theme.fonts.primary};
  color: ${theme.colors.text};
  flex: 1;
`;

const LastSeen = styled.span`
  font-family: ${theme.fonts.primary};
  color: ${theme.colors.textLight};
  font-size: 0.8rem;
  margin-right: ${theme.spacing.sm};
`;

const ActionButton = styled.button`
  background-color: ${theme.colors.secondary};
  color: ${theme.colors.background};
  border: none;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.small};
  cursor: pointer;
  font-family: ${theme.fonts.primary};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${theme.colors.dark};
  }
`;

const CallButton = styled.button`
  background-color: ${theme.colors.success};
  color: ${theme.colors.background};
  border: none;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.small};
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }

  &:disabled {
    background-color: ${theme.colors.textLight};
    cursor: not-allowed;
  }
`;

const RequestsBadge = styled.span`
  background-color: ${theme.colors.error};
  color: ${theme.colors.background};
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.8rem;
  margin-left: ${theme.spacing.xs};
`;

interface Friend {
  username: string;
  online_status: boolean;
  last_seen: string;
}

interface FriendsListProps {
  friends: Friend[];
  currentUsername: string;
  socket: any;
  onAddFriend: () => void;
  onShowRequests: () => void;
  pendingRequestsCount: number;
}

const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  currentUsername,
  socket,
  onAddFriend,
  onShowRequests,
  pendingRequestsCount,
}) => {
  const [activeCall, setActiveCall] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    username: string;
    offer: RTCSessionDescriptionInit;
  } | null>(null);

  useEffect(() => {
    if (socket) {
      socket.on(
        "incoming_call",
        (data: { caller: string; offer: RTCSessionDescriptionInit }) => {
          setIncomingCall({
            username: data.caller,
            offer: data.offer,
          });
        }
      );
    }
    return () => {
      if (socket) {
        socket.off("incoming_call");
      }
    };
  }, [socket]);

  const formatLastSeen = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return "Az önce";
    if (diffInMinutes < 60) return `${diffInMinutes} dakika önce`;
    if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} saat önce`;
    }
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCallFriend = (friendUsername: string) => {
    setActiveCall(friendUsername);
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      setActiveCall(incomingCall.username);
      setIncomingCall(null);
    }
  };

  const handleRejectCall = () => {
    setIncomingCall(null);
  };

  return (
    <>
      <Container>
        <Header>
          <Title>Arkadaşlar</Title>
          <div>
            <ActionButton onClick={onAddFriend}>Arkadaş Ekle</ActionButton>
            <ActionButton
              onClick={onShowRequests}
              style={{ marginLeft: theme.spacing.sm }}
            >
              İstekler
              {pendingRequestsCount > 0 && (
                <RequestsBadge>{pendingRequestsCount}</RequestsBadge>
              )}
            </ActionButton>
          </div>
        </Header>
        <List>
          {friends.map((friend) => (
            <FriendItem key={friend.username}>
              <OnlineStatus isOnline={friend.online_status} />
              <Username>{friend.username}</Username>
              {!friend.online_status && friend.last_seen && (
                <LastSeen>
                  Son görülme: {formatLastSeen(friend.last_seen)}
                </LastSeen>
              )}
              <CallButton
                onClick={() => handleCallFriend(friend.username)}
                disabled={!friend.online_status}
              >
                Ara
              </CallButton>
            </FriendItem>
          ))}
          {friends.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: theme.colors.textLight,
                padding: theme.spacing.lg,
              }}
            >
              Henüz arkadaşınız yok
            </div>
          )}
        </List>
      </Container>

      {activeCall && (
        <CallInterface
          socket={socket}
          username={currentUsername}
          targetUser={activeCall}
          onClose={handleEndCall}
        />
      )}

      {incomingCall && (
        <IncomingCallDialog
          socket={socket}
          callerUsername={incomingCall.username}
          offer={incomingCall.offer}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </>
  );
};

export default FriendsList;
