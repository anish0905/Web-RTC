import "./App.css";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/Home";
import { SocketProvider } from "./providers/Socket";
import { PeerProvider } from "./providers/Peer";
import RoomPage from "./pages/Room";

function App() {
  return (
    <>
      <SocketProvider>
        <PeerProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chat/:roomId" element={<RoomPage />} />
          </Routes>
        </PeerProvider>
      </SocketProvider>
    </>
  );
}

export default App;
