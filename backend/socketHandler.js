/**
 * Socket.io handler for WebRTC video call signaling.
 * Lightweight — only handles room join/leave and peer discovery.
 */
module.exports = function initSocketHandler(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        socket.on('join-room', ({ roomId, peerId }) => {
            if (!roomId || !peerId) return;

            socket.join(roomId);
            // Tell everyone else in the room that a new peer has joined
            socket.to(roomId).emit('user-connected', peerId);

            console.log(`[Socket] ${peerId} joined room ${roomId}`);

            socket.on('disconnect', () => {
                socket.to(roomId).emit('user-disconnected', peerId);
                console.log(`[Socket] ${peerId} left room ${roomId}`);
            });
        });
    });
};
