/**
 * Socket.io handler for WebRTC video call signaling.
 * Handles room join/leave and peer discovery with robust logging.
 */
module.exports = function initSocketHandler(io) {
    // Track which rooms have which peers for debugging
    const roomPeers = new Map();

    io.on('connection', (socket) => {
        console.log(`[Socket] ✓ Client connected: ${socket.id}`);

        let joinedRoomId = null;
        let joinedPeerId = null;

        socket.on('join-room', ({ roomId, peerId }) => {
            if (!roomId || !peerId) {
                console.warn(`[Socket] ✗ Invalid join-room: roomId=${roomId}, peerId=${peerId}`);
                return;
            }

            // Track the room this socket is in
            joinedRoomId = roomId;
            joinedPeerId = peerId;

            socket.join(roomId);

            // Track peers in the room
            if (!roomPeers.has(roomId)) {
                roomPeers.set(roomId, new Set());
            }
            roomPeers.get(roomId).add(peerId);

            const peersInRoom = roomPeers.get(roomId).size;
            console.log(`[Socket] ✓ ${peerId} joined room ${roomId} (${peersInRoom} peer(s) in room)`);

            // Tell everyone else in the room that a new peer has joined
            socket.to(roomId).emit('user-connected', peerId);
        });

        socket.on('disconnect', (reason) => {
            console.log(`[Socket] Client disconnected: ${socket.id} (reason: ${reason})`);

            if (joinedRoomId && joinedPeerId) {
                // Remove from peer tracking
                const peers = roomPeers.get(joinedRoomId);
                if (peers) {
                    peers.delete(joinedPeerId);
                    if (peers.size === 0) {
                        roomPeers.delete(joinedRoomId);
                    }
                }

                const remaining = roomPeers.get(joinedRoomId)?.size || 0;
                console.log(`[Socket] ✗ ${joinedPeerId} left room ${joinedRoomId} (${remaining} peer(s) remaining)`);

                // Notify others
                socket.to(joinedRoomId).emit('user-disconnected', joinedPeerId);
            }
        });
    });
};
