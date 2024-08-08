const express = require("express");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");

const app = express();
const io = new Server(8001, { cors: { origin: "*" } });

app.use(bodyParser.json());

const emailToSocketMapping = new Map();
const socketToEmailMapping = new Map();

io.on("connection", (socket) => {
  console.log("New connection");

  // Handle user joining a room
  socket.on("join-room", (data) => {
    const { roomId, emailId } = data;

    console.log("User", emailId, "joined Room", roomId);

    emailToSocketMapping.set(emailId, socket.id);
    socketToEmailMapping.set(socket.id, emailId);

    socket.join(roomId);
    socket.emit("joined-room", { roomId });
    socket.broadcast.to(roomId).emit("user-joined", { emailId });
  });

  // Handle call initiation
  socket.on("call-user", (data) => {
    const { offer, emailId } = data;
    const fromEmail = socketToEmailMapping.get(socket.id);
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("incoming-call", { from: fromEmail, offer });
    } else {
      console.error(`No socketId found for emailId: ${emailId}`);
    }
  });

  // Handle call acceptance
  socket.on("call-accepted", (data) => {
    const { answer, emailId } = data;
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("call-accepted", { answer });
    } else {
      console.error(`No socketId found for emailId: ${emailId}`);
    }
  });

  // Handle ICE candidates
  socket.on("ice-candidate", (data) => {
    const { candidate, emailId } = data;
    const socketId = emailToSocketMapping.get(emailId);
    if (socketId) {
      socket.to(socketId).emit("ice-candidate", { candidate });
    } else {
      console.error(`No socketId found for emailId: ${emailId}`);
    }
  });

  // Clean up on disconnect
  socket.on("disconnect", () => {
    const emailId = socketToEmailMapping.get(socket.id);
    if (emailId) {
      emailToSocketMapping.delete(emailId);
      socketToEmailMapping.delete(socket.id);
    }
    console.log("User disconnected");
  });
});

app.listen(8000, () => console.log("===HTTP Server running at PORT 8000==="));
