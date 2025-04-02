import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import {generateResult} from './services/ai.service.js'

const port=process.env.PORT||3000;

const server =http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});



io.use(async (socket, next) => {

    try {

        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[ 1 ];
        const projectId = socket.handshake.query.projectId;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return next(new Error('Invalid projectId'));
        }


        socket.project = await projectModel.findById(projectId);


        if (!token) {
            return next(new Error('Authentication error'))
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'))
        }


        socket.user = decoded;

        next();

    } catch (error) {
        next(error)
    }

});



io.on('connection', socket => {
    console.log('a user connected');

    socket.join(socket.project._id.toString());
    
    socket.on('project-message', async (data) => {
        try {
            const message = data.message;

            const AIisPresentInMessage = message.includes('@AI');
            socket.to(socket.project._id.toString()).emit('project-message', data);

            if (AIisPresentInMessage) {
                const prompt = message.replace('@AI', '');
                const result = await generateResult(prompt);

                io.to(socket.project._id.toString()).emit('project-message', {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: "AI",
                    },
                });
            }
        } catch (error) {
            console.error("Error in project-message handler:", error.message);
            socket.emit('error', { message: "Failed to process AI request." });
        }
    });

    socket.on('event', data => { /* … */ });
    socket.on('disconnect', () => { /* … */ });
});

server.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
 });