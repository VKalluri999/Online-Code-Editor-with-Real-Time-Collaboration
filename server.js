const express = require('express')
const app=express();
const cors= require('cors');
app.use(cors());
const http=require('http');
const {Server} = require('socket.io');

const server = http.createServer(app);
const io= new Server(server);

const SocketUserMap={};
const SocketColorMap={};
var TestCaseRoomMap={};
var LangRoomMap={};

io.on('connection',(socket)=>{
    console.log('socket connected',socket.id);


function getConnectedUsers(roomId){
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username:SocketUserMap[socketId],
            color:SocketColorMap[socketId],
        };
    } );
}   

    socket.on('chatMessage', (message,roomId) => {
        // Broadcast the message to all connected clients
        // console.log(`Getting it room id is:${roomId}`);
        io.to(roomId).emit('chatMessage', { username: SocketUserMap[socket.id], message,color:SocketColorMap[socket.id] });
        
        // socket.broadcast.to(roomId).emit('chatMessage', { username: SocketUserMap[socket.id], message,color:SocketColorMap[socket.id] });
    });

    socket.on('testcasesChange', (testCases,roomId) => {
        // Broadcast the message to all connected clients
        // socket.in(roomId).emit('chatMessage', { username: SocketUserMap[socket.id], message,color:SocketColorMap[socket.id] });
        TestCaseRoomMap[roomId]=testCases;
        console.log(`Value updated is: ${TestCaseRoomMap[roomId]}`);
        io.to(roomId).emit('updateTestcase', testCases);
    });

    socket.on('join',({roomId,username}) => {
        console.log(`Calling ${username}`);
        SocketUserMap[socket.id] = username;
        SocketColorMap[socket.id]=`rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)})`;
        socket.join(roomId); 
        const Users = getConnectedUsers(roomId);
        console.log(Users);
        Users.forEach(({socketId}) =>
        {
            io.to(socketId).emit('joined',{
                Users,
                username,
                socketId:socket.id,
                uscolor:SocketColorMap[socket.id]
            })
        })

    }
    )

    socket.on('disconnecting',() => {
        const rooms= [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit('disconnected',
            {
                socketId:socket.id,
                username:SocketUserMap[socket.id],
            })
        });
        delete SocketUserMap[socket.id];
        delete SocketColorMap[socket.id];
        socket.leave();

    })


    socket.on('language_change', ({ roomId, lang ,username}) => {
        console.log(`lang is ${lang} roomid is ${roomId}`)
        LangRoomMap[roomId]=lang;
        // io.to(roomId).emit('language_change', { lang,username });
        socket.broadcast.to(roomId).emit('language_change', { lang,username });
    });


    socket.on('code_change', ({ roomId, code }) => {
        
        socket.in(roomId).emit('code_change', { code });
    });

    // socket.on('sync_code', ({ socketId, code }) => {
    //     console.log(`Codeload: ${code} and value is ${code ==  null}`)
    //     if(code == null)
    //     {
    //         code = '# Type your code here...'
    //     }
    //     io.to(socketId).emit('code_change', code);
    // });
    socket.on('sync_user',(roomId)=>
    {
        console.log(`Room id is: ${roomId}`);
        console.log(`Map value is: ${TestCaseRoomMap}`);
        if(TestCaseRoomMap[roomId])
        {
            console.log(`Room id is: ${roomId}`);
            io.to(roomId).emit('updateTestcase', TestCaseRoomMap[roomId]); 
    }
    if(LangRoomMap[roomId])
        {
            
            io.to(roomId).emit('language_change', {lang:LangRoomMap[roomId],username:''}); 
    }



})
});



const PORT= process.env.PORT || 5000;
server.listen(PORT,()=> console.log(`Listening on Port number ${PORT}`));