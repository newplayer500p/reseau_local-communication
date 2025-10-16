import dotenv from "dotenv";
import http from 'http';
import app from "./app.js"
import connectDB from "./src/config/db.config.js";
import { initSockets } from "./src/sockets/index.js";

dotenv.config();

const PORT = process.env.HTTP_PORT;
const DB_URI = process.env.URL_DB;

const server = http.createServer(app);

server.setTimeout(0);
server.keepAliveTimeout = 65000;

// 2. initialiser socket.io
const io = initSockets(server, {
  corsOrigin: "http://localhost:5173"  // ton frontend
});

app.locals.io = io;

connectDB(DB_URI)
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });

  })
