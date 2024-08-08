import React, {
  useMemo,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const PeerContext = createContext(null);

export const usePeer = () => useContext(PeerContext);

export const PeerProvider = ({ children }) => {
  const [remoteStream, setRemoteStream] = useState(null);
  const peer = useMemo(
    () =>
      new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      }),
    []
  );

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("ICE candidate:", event.candidate);
    } else {
      console.log("All ICE candidates have been sent");
    }
  };

  const createOffer = async () => {
    try {
      console.log("Creating offer...");
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      console.log("Offer created and set as local description:", offer);
      return offer;
    } catch (error) {
      console.error("Error creating offer:", error);
      throw error;
    }
  };

  const createAnswer = async (offer) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      return answer;
    } catch (error) {
      console.error("Error creating answer:", error);
      throw error;
    }
  };

  const setRemoteAns = async (answer) => {
    try {
      await peer.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error("Error setting remote answer:", error);
    }
  };

  const sendStream = async (stream) => {
    try {
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      console.log("All tracks have been added to the peer connection");
    } catch (error) {
      console.error("Error adding tracks to peer connection:", error);
    }
  };

  useEffect(() => {
    const handleTrackEvent = (event) => {
      setRemoteStream(event.streams[0]);
    };

    peer.addEventListener("track", handleTrackEvent);

    return () => {
      peer.removeEventListener("track", handleTrackEvent);
    };
  }, [peer]);

  return (
    <PeerContext.Provider
      value={{
        peer,
        remoteStream,
        createOffer,
        createAnswer,
        setRemoteAns,
        sendStream,
      }}
    >
      {children}
    </PeerContext.Provider>
  );
};

export default PeerContext;
