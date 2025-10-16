import express from "express";

const createEventRouter = (app) => {
  const router = express.Router();

  router.get("/", (req, res) => {
    // Headers spécifiques SSE seulement
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    res.flushHeaders();

    res.write(": SSE Connection Established\n\n");

    const clientId = Date.now() + Math.random();
    const client = { id: clientId, res, token: req.query.token };

    if (!Array.isArray(app.locals.sseClients)) {
      app.locals.sseClients = [];
    }

    app.locals.sseClients.push(client);
    console.log(
      `Nouveau client SSE connecté. Total: ${app.locals.sseClients.length}`
    );

    // Heartbeat
    const keepAlive = setInterval(() => {
      try {
        res.write(`: heartbeat ${Date.now()}\n\n`);
      } catch (e) {
        clearInterval(keepAlive);
      }
    }, 30000);

    // Gestion fermeture
    req.on("close", () => {
      clearInterval(keepAlive);
      app.locals.sseClients = app.locals.sseClients.filter(
        (c) => c.id !== clientId
      );
      console.log(
        `Client SSE déconnecté. Restants: ${app.locals.sseClients.length}`
      );
    });
  });

  return router;
};

export default createEventRouter;
