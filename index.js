import express from "express";
import http from "http";
// import dotenv from "dotenv";
const app = express();
const server = http.createServer(app);

import { Server } from "socket.io";
// dotenv.config();
// const server = app.listen(process.env.PORT, () => {
//   console.log(`server started on port ${process.env.PORT}`);
// });

// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     credentials: true,
//   },
// });

const io = new Server(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
  pingTimeout: 600000,
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    // console.log("userId SOCKET ADD USER", userId, socket.id);
    if (userId !== null) {
      onlineUsers.set(userId, socket.id);
    }
    // onlineUsers.set(userId, socket.id);
    console.log("onlineUsers", onlineUsers);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
  });

  // socket.on("client-ready", () => {
  //   console.log("client-ready", socket.id);
  //   socket.emit("get-canvas-state");
  // });

  socket.on("signout", (id) => {
    onlineUsers.delete(id);
    socket.broadcast.emit("online-users", {
      onlineUsers: Array.from(onlineUsers.keys()),
    });
    console.log("onlineUsers signout", onlineUsers);
  });

  socket.on("outgoing-drawing-chat", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    // console.log("onlineUsers", sendUserSocket);
    // console.log("outgoing-drawing-chat", data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("incoming-drawing-chat", {
        from: data.from,
        roomId: data.roomId,
        callType: data.callType,
      });
    } else {
      const senderSocket = onlineUsers.get(data.from);
      socket.to(senderSocket).emit("drawing-chat-offline");
    }
  });

  socket.on("reject-drawing-chat", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("drawing-chat-rejected");
    }
  });

  socket.on("accept-incoming-drawing-chat", ({ id }) => {
    // console.log("receiver", id);
    const sendUserSocket = onlineUsers.get(id);
    socket.to(sendUserSocket).emit("accept-drawing");
  });

  // io.on("connection", (socket) => {
  //   socket.on("client-ready", () => {
  //     console.log("client-ready", socket.id);
  //     socket.emit("get-canvas-state");
  //   });
  // socket.on("send-msg", (data) => {
  //   const sendUserSocket = onlineUsers.get(data.to);
  //   if (sendUserSocket) {
  //     socket.to(sendUserSocket).emit("msg-recieve", { from: data.from, message: data.message });
  //   }
  // });

  socket.on("canvas-state", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    // console.log("rcanvas-state");
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("canvas-state-from-server", data.state);
    }
  });

  socket.on("draw-line", ({ prevPoint, currentPoint, color, to }) => {
    const sendUserSocket = onlineUsers.get(to);
    // console.log("draw-line");
    if (sendUserSocket) {
      // socket.to(sendUserSocket).emit("draw-line", { from: data.from, message: data.message });
      socket.to(sendUserSocket).emit("draw-line", { prevPoint, currentPoint, color });
    }
  });
socket.on("ping", ({ to }) => {
    const sendUserSocket = onlineUsers.get(to);

    if (sendUserSocket) {
      //console.log("PING");
      // socket.to(sendUserSocket).emit("draw-line", { from: data.from, message: data.message });
      socket.to(sendUserSocket).emit("pong");
    }
  });
  
  socket.on("clear", (data) => {
    const sendUserSocket = onlineUsers.get(data.from);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("clear");
    }
  });
  // socket.on("clear", () => {
  //   io.emit("clear");
  // });

  socket.on("disconnect", () => {
    console.log("연결이 끊어졌습니다 Drawing server에서");
    // 연결이 끊어진 경우 추가 작업 수행
  });
  /**
   *
   */
});


server.listen(3010, () => {
  console.log(`server started on port 3010`);
});
