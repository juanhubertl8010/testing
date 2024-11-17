const http = require("http");
const socketIo = require("socket.io");
const NodeRSA = require("node-rsa");

const server = http.createServer();
const io = socketIo(server);

const users = new Map();

io.on("connection", (socket) => {
  console.log(`Client ${socket.id} connected`);

  socket.emit("init", Array.from(users.entries()));

  socket.on("registerPublicKey", (data) => {
    const { username, publicKey } = data;
    users.set(username, publicKey);
    console.log(`${username} registered with public key.`);

    io.emit("newUser", { username, publicKey });
  });

  socket.on("message", (data) => {
    const { username, message, signature } = data;
    const publicKey = users.get(username);

    if (publicKey) {
      const key = new NodeRSA(publicKey);
      const isVerified = key.verify(message, signature, "utf8", "base64");

      if (isVerified) {
        io.emit("message", { username, message });
      } else {
        io.emit("message", { username, message: "⚠️ This user is fake!" });
        console.warn(`Impersonation attempt detected from ${username}`);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
