// Socket.io event handlers.
// Responsible for:
// - Joining clients to document-specific "rooms"
// - Broadcasting content changes in real time to other clients in the same room
//
// NOTE FOR REVIEWERS (Socket.io explanation):
// - `socket.on(eventName, handler)` means: "listen for this event from the *client*".
// - `socket.emit(eventName, payload)` means: "send an event to just this connected client".
// - `socket.to(roomId).emit(eventName, payload)` means: "send to everyone else in that room,
//    but NOT the sender". We use this pattern so we don't echo text back to the author.

const Document = require('./models/Document');

function registerSocketHandlers(io) {
  // This callback is run for every new web-socket connection from a client.
  // Each browser tab that connects gets its own `socket` object instance.
  io.on('connection', (socket) => {
    console.log('🔌 New client connected', socket.id);

    // Client wants to work on a specific document.
    // The frontend calls: socket.emit('join-document', documentId)
    // Here we "listen" for that event so we know which document this socket cares about.
    socket.on('join-document', async (documentId) => {
      if (!documentId) return;

      // Attach this socket to a logical "room" that has the same name as the document id.
      // All sockets in the same room will receive document change broadcasts.
      socket.join(documentId);
      console.log(`Socket ${socket.id} joined room ${documentId}`);

      // Optional: load latest content from DB and send to this client only.
      // This is a one-time sync when a user first joins a document.
      try {
        const document = await Document.findById(documentId).exec();
        if (document) {
          // Emit only to the connecting socket, NOT the whole room.
          // Client listens with: socket.on('load-document', (content) => { ... })
          socket.emit('load-document', document.content);
        }
      } catch (err) {
        console.error('Error loading document for socket client', err);
      }
    });

    // When a client makes changes, broadcast them to others in the room.
    // payload shape: { documentId, content }
    //
    // Frontend: socket.emit('send-changes', { documentId, content })
    // Backend here: socket.on('send-changes', ...) receives that payload.
    socket.on('send-changes', ({ documentId, content }) => {
      if (!documentId) return;

      // Send to everyone else in the same room (except the sender).
      // This avoids the sender receiving their own keystrokes back.
      socket.to(documentId).emit('receive-changes', content);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected', socket.id);
    });
  });
}

module.exports = { registerSocketHandlers };

