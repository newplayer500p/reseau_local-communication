export function broadcastEvent(app, eventName, data) {
  if (!app.locals.sseClients || !Array.isArray(app.locals.sseClients)) {
    console.log("Aucun client SSE connecté");
    return;
  }

  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;

  console.log(
    `Diffusion de l'événement ${eventName} à ${app.locals.sseClients.length} clients`
  );

  // Diffuser à tous les clients connectés
  app.locals.sseClients.forEach((client, index) => {
    try {
      client.res.write(message);
      console.log(`Événement envoyé au client ${index + 1}`);
    } catch (error) {
      console.error(`Erreur envoi au client ${index + 1}:`, error);
      // Supprimer le client déconnecté
      app.locals.sseClients = app.locals.sseClients.filter(
        (c) => c.id !== client.id
      );
    }
  });
}
