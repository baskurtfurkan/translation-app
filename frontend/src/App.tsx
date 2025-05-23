import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import styled from "styled-components";
import WelcomePage from "./components/WelcomePage";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import FriendsList from "./components/FriendsList";
import TranslationInterface from "./components/TranslationInterface";
import AddFriendForm from "./components/AddFriendForm";
import FriendRequests from "./components/FriendRequests";
import { theme } from "./styles/theme";

interface Friend {
  username: string;
  online_status: boolean;
  last_seen: string;
}

const API_URL = "http://localhost:8000";

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f5f5f5;
`;

const MainContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [username, setUsername] = useState("");
  const [socket, setSocket] = useState<any>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io("http://localhost:8000");
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on("connect", () => {
      console.log("Connected to server");
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (socket && username) {
      // Register user with socket
      socket.emit("register_user", { username });

      // Get initial friend requests count
      socket.emit("get_friend_requests", { username });

      // Get initial friends list
      socket.emit("get_friends", { username });

      // Listen for friend status updates
      socket.on("user_online", (data: { username: string }) => {
        setFriends((prevFriends) =>
          prevFriends.map((friend) =>
            friend.username === data.username
              ? { ...friend, online_status: true }
              : friend
          )
        );
      });

      socket.on("user_offline", (data: { username: string }) => {
        setFriends((prevFriends) =>
          prevFriends.map((friend) =>
            friend.username === data.username
              ? {
                  ...friend,
                  online_status: false,
                  last_seen: new Date().toISOString(),
                }
              : friend
          )
        );
      });

      // Listen for friend requests list
      socket.on("friend_requests_list", (data: { requests: string[] }) => {
        setPendingRequestsCount(data.requests.length);
      });

      // Listen for new friend requests
      socket.on("friend_request_received", () => {
        setPendingRequestsCount((prev) => prev + 1);
      });

      // Listen for friends list updates
      socket.on("friends_list", (data: { friends: Friend[] }) => {
        setFriends(data.friends);
      });

      // Listen for accepted/rejected friend requests
      socket.on("friend_request_accepted", (data: { username: string }) => {
        // Get updated friends list
        socket.emit("get_friends", { username });
      });

      // Clean up listeners when component unmounts
      return () => {
        socket.off("user_online");
        socket.off("user_offline");
        socket.off("friend_requests_list");
        socket.off("friend_request_received");
        socket.off("friends_list");
        socket.off("friend_request_accepted");
      };
    }
  }, [socket, username]);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }

      const data = await response.json();
      setUsername(data.username);
      setIsLoggedIn(true);
      setShowLogin(false);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const handleRegister = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }

      setShowRegister(false);
      setShowLogin(true);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const handleAddFriend = async (friendUsername: string) => {
    if (socket) {
      try {
        socket.emit("friend_request", {
          from: username,
          to: friendUsername,
        });
        setShowAddFriend(false);
      } catch (error) {
        console.error("Error sending friend request:", error);
        throw error;
      }
    }
  };

  const handleAddFriendClick = () => {
    setShowAddFriend(true);
  };

  const handleShowRequests = () => {
    setShowFriendRequests(true);
  };

  if (!isLoggedIn) {
    return (
      <>
        <WelcomePage
          onLoginClick={() => setShowLogin(true)}
          onRegisterClick={() => setShowRegister(true)}
        />
        {showLogin && (
          <Modal>
            <LoginForm
              onLogin={handleLogin}
              onClose={() => setShowLogin(false)}
            />
          </Modal>
        )}
        {showRegister && (
          <Modal>
            <RegisterForm
              onRegister={handleRegister}
              onClose={() => setShowRegister(false)}
            />
          </Modal>
        )}
      </>
    );
  }

  return (
    <AppContainer>
      <FriendsList
        friends={friends}
        currentUsername={username}
        socket={socket}
        onAddFriend={handleAddFriendClick}
        onShowRequests={handleShowRequests}
        pendingRequestsCount={pendingRequestsCount}
      />
      <MainContent>
        <TranslationInterface socket={socket} />
      </MainContent>
      {showAddFriend && (
        <Modal>
          <AddFriendForm
            onAddFriend={handleAddFriend}
            onClose={() => setShowAddFriend(false)}
          />
        </Modal>
      )}
      {showFriendRequests && (
        <Modal>
          <FriendRequests
            socket={socket}
            username={username}
            onClose={() => setShowFriendRequests(false)}
          />
        </Modal>
      )}
    </AppContainer>
  );
};

export default App;
