import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import ACTIONS from "./action.js";
import codeRoutes from "./routes/codeRoutes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
});
io.engine.on("connection_error", (err) => {
  console.log("Socket connection error:");
  console.log("Message:", err.message);
  console.log("Code:", err.code);
  console.log("Context:", err.context);
});

app.use("/api/code", codeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Collaborative Editor Backend Running.",
  });
});

const userSocketMap = {};

function getAllConnectedClients(roomId) {
  const clients = io.sockets.adapter.rooms.get(roomId) || [];

  return [...clients].map((socketId) => ({
    socketId,
    username: userSocketMap[socketId],
  }));
}

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, newuser }) => {
    if (!roomId || !newuser) return;

    userSocketMap[socket.id] = newuser;

    socket.join(roomId);

    const clients = getAllConnectedClients(roomId);

    io.to(roomId).emit(ACTIONS.JOINED, {
      clients,
      newuser,
      socketId: socket.id,
    });

    console.log(`${newuser} joined room ${roomId}`);
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    if (!roomId) return;

    socket.to(roomId).emit(ACTIONS.CODE_CHANGE, {
      code,
    });
  });

  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    if (!roomId) return;

    socket.to(roomId).emit(ACTIONS.LANGUAGE_CHANGE, {
      language,
    });
  });

  socket.on(ACTIONS.CHAT_MESSAGE, ({ roomId, message }) => {
    if (!roomId || !message?.id || !message?.message) {
      return;
    }

    socket.to(roomId).emit(ACTIONS.CHAT_MESSAGE, {
      roomId,
      message,
    });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    if (!socketId) return;

    io.to(socketId).emit(ACTIONS.CODE_CHANGE, {
      code,
    });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];

    rooms.forEach((roomId) => {
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];

    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 9000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
