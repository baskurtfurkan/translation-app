export const setupSocket = (io: Server) => {
  // ... existing socket setup ...

  socket.on('translated_audio', (data: { target: string, audio: ArrayBuffer }) => {
    const targetSocket = connectedUsers.get(data.target);
    if (targetSocket) {
      io.to(targetSocket).emit('translated_audio', {
        audio: data.audio
      });
    }
  });

  // ... existing socket events ...
}; 