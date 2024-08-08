import React, { useState, useEffect, useCallback } from "react";
import { useSocket } from "../providers/Socket";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState("");

  const handleJoinRoom = useCallback(() => {
    if (email && roomId) {
      navigate(`/chat/${roomId}`);
      if (socket) {
        socket.emit("join-room", { roomId, emailId: email });
      }
    } else {
      alert("Please enter both email and room code.");
    }
  }, [email, roomId, socket, navigate]);

  useEffect(() => {
    const handleRoomJoinSuccess = ({ roomId }) => {
      console.log("Room joined successfully:", roomId);
    };

    if (socket) {
      socket.on("room-join-success", handleRoomJoinSuccess);

      // Cleanup the event listener when the component unmounts
      return () => {
        socket.off("room-join-success", handleRoomJoinSuccess);
      };
    }
  }, [socket]);

  return (
    <div className="homepage-container">
      <div className="input-container">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="text"
          placeholder="Enter Room code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={handleJoinRoom}>Enter Room</button>
      </div>
    </div>
  );
};

export default HomePage;
