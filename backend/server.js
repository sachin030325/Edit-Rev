import express from 'express';
import {createServer} from 'http';
import {Server} from 'socket.io';
import {YSocketIO} from "y-socket.io/dist/server";

const app = express();

app.use(express.static("public"));
const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

const ySocketIO = new YSocketIO(io);
ySocketIO.initialize();

const publishOnlineUsers = (namespace) => {
    const users = Array.from(namespace.sockets.values())
        .map((socket) => socket.data.userName)
        .filter(Boolean);

    namespace.emit('presence-users', users);
};

// Presence is tied to the actual socket connection, so closing a tab removes
// that user from everyone else's sidebar immediately.
ySocketIO.nsp.on('connection', (socket) => {
    socket.on('presence-join', (userName) => {
        const cleanName = typeof userName === 'string' ? userName.trim() : '';
        if (!cleanName) return;

        socket.data.userName = cleanName;
        publishOnlineUsers(socket.nsp);
    });

    socket.on('disconnect', () => {
        publishOnlineUsers(socket.nsp);
    });
});




app.get('/health', (req, res) => {
    res.status(200).json({
        message: 'Server is healthy',
        success: true
    }); 
});



httpServer.listen(3000, () => {
    console.log('Server is running on port 3000');
});

