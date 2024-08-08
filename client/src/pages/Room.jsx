import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../providers/Socket";
import { usePeer } from "../providers/Peer";

const RoomPage = () => {
  const { socket } = useSocket();
  const {
    peer,
    createOffer,
    createAnswer,
    setRemoteAns,
    sendStream,
    remoteStream,
  } = usePeer();
  const [myStream, setMyStream] = useState(null);
  const [remoteEmailId, setRemoteEmailId] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoDisabled, setVideoDisabled] = useState(false);

  const handleNewUserJoined = useCallback(
    async (data) => {
      const { emailId } = data;
      console.log(`New user joined room:`, emailId);
      try {
        const offer = await createOffer();
        socket.emit("call-user", { offer, emailId });
        setRemoteEmailId(emailId);
      } catch (error) {
        console.error("Error creating offer: ", error);
      }
    },
    [createOffer, socket]
  );

  const handleIncomingCall = useCallback(
    async (data) => {
      const { from, offer } = data;
      console.log("Incoming call from:", from, "with offer:", offer);
      try {
        const answer = await createAnswer(offer);
        socket.emit("call-accepted", { emailId: from, answer });
        setRemoteEmailId(from);
      } catch (error) {
        console.error("Error creating answer: ", error);
      }
    },
    [createAnswer, socket]
  );

  const handleCallAccepted = useCallback(
    async (data) => {
      const { answer } = data;
      console.log("Call got accepted:", answer);
      try {
        await setRemoteAns(answer);
      } catch (error) {
        console.error("Error setting remote answer: ", error);
      }
    },
    [setRemoteAns]
  );

  const handleIceCandidate = useCallback(
    (data) => {
      const { candidate } = data;
      peer.addIceCandidate(new RTCIceCandidate(candidate));
    },
    [peer]
  );

  const getUserMediaStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: !videoDisabled,
        audio: !muted,
      });
      console.log("User media stream:", stream);
      setMyStream(stream);
      sendStream(stream);
    } catch (error) {
      console.error("Error getting user media stream: ", error);
    }
  }, [sendStream, videoDisabled, muted]);

  const handleNegotiationNeeded = useCallback(async () => {
    try {
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      socket.emit("call-user", { emailId: remoteEmailId, offer });
      console.log("Negotiation needed, offer sent");
    } catch (error) {
      console.error("Error during negotiation needed:", error);
    }
  }, [peer, remoteEmailId, socket]);

  useEffect(() => {
    if (peer) {
      peer.addEventListener("negotiationneeded", handleNegotiationNeeded);
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", {
            emailId: remoteEmailId,
            candidate: event.candidate,
          });
        }
      };
    }
    return () => {
      if (peer) {
        peer.removeEventListener("negotiationneeded", handleNegotiationNeeded);
      }
    };
  }, [handleNegotiationNeeded, peer, remoteEmailId, socket]);

  useEffect(() => {
    socket.on("user-joined", handleNewUserJoined);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-accepted", handleCallAccepted);
    socket.on("ice-candidate", handleIceCandidate);

    return () => {
      socket.off("user-joined", handleNewUserJoined);
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-accepted", handleCallAccepted);
      socket.off("ice-candidate", handleIceCandidate);
    };
  }, [
    socket,
    handleNewUserJoined,
    handleIncomingCall,
    handleCallAccepted,
    handleIceCandidate,
  ]);

  useEffect(() => {
    getUserMediaStream();
  }, [getUserMediaStream]);

  const toggleMute = () => {
    setMuted((prev) => !prev);
    getUserMediaStream(); // Refresh the stream with the new settings
  };

  const toggleVideo = () => {
    setVideoDisabled((prev) => !prev);
    getUserMediaStream(); // Refresh the stream with the new settings
  };

  return (
    <div className="room-page-container">
      <h1>Room page</h1>
      <h4>You are connected to {remoteEmailId}</h4>
      <button onClick={toggleMute}>{muted ? "Unmute" : "Mute"}</button>
      <button onClick={toggleVideo}>
        {videoDisabled ? "Enable Video" : "Disable Video"}
      </button>
      {myStream && (
        <video
          autoPlay
          muted
          style={{ width: "100%", height: "auto" }}
          ref={(video) => {
            if (video) video.srcObject = myStream;
          }}
        />
      )}
      {remoteStream && (
        <video
          autoPlay
          style={{ width: "100%", height: "auto" }}
          ref={(video) => {
            if (video) video.srcObject = remoteStream;
          }}
        />
      )}
    </div>
  );
};

export default RoomPage;
