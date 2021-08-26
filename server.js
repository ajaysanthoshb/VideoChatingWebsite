const express = require('express')
const app = express()
app.enable('trust proxy')
var rooms = {}
var persons_arr = {}
var counter = 1
const uuid = require('uuid')
var port = process.env.PORT || 3000
var room_id;
var sockets = {};
app.set('view engine','hbs')
app.set('views',__dirname+'/static_files')

app.get('/',(req,res)=>{
    res.redirect(`${uuid.v4()}`)
})
app.use(express.static(__dirname+'/static_files'))
app.get('/:room_id',(req,res)=>{
    room_id = req.params.room_id
    if(!rooms[room_id]){
        rooms[room_id] = 1
    }
    else{
        rooms[room_id] += 1
    }
    if(rooms[room_id]>4)
    {   
        rooms[room_id] = 4
        res.send("<h2 style='color:red'>THIS ROOM IS FULL , JOIN LATER or TRY TO JOIN AT OTHER ROOM </h2>")
    }

    else{
        res.render('index',{counting:counter.toString(),})
    }
})

const server = require('http').createServer(app)
const io = require('socket.io')(server)

io.on('connection',(socket)=>{
    counter = (counter+1)%20
    //If connection happens accessing clients socket
    socket.emit('send_room_id',room_id)
    
    socket.on('send_person',p=>{
        socket.person = p
    })

    socket.on('join-room',(roomID,userID)=>{
        socket.userID = userID
        socket.roomID = roomID
        
        // socket.join(socket.roomID)
        // socket.broadcast.to(socket.roomID).emit('user-connected',socket.userID)
        socket.broadcast.emit('user-connected',socket.userID,socket.roomID)
    })
    socket.on('disconnect',()=>{
        rooms[socket.roomID] -= 1
        console.log(rooms[socket.roomID])
        console.log("USERID: " + socket.userID + "ROOMID: " + socket.roomID)
        // socket.broadcast.to(socket.roomID).emit('user-disconnected',socket.person,socket.userID)
        socket.broadcast.emit('user-disconnected',socket.person,socket.userID,socket.roomID)
    })
    socket.on('message',(msg,ROOMIE)=>{
        //Send this clients msg to remaining clients
        // socket.broadcast.to(socket.roomID).emit('broadcast_msg',msg,ROOMIE)
        socket.broadcast.emit('broadcast_msg',msg,ROOMIE,socket.roomID)
    })
    socket.on('status',(person,one_user)=>{
        // socket.broadcast.to(socket.roomID).emit('broadcast_status',person,one_user)
        socket.broadcast.emit('broadcast_status',person,one_user,socket.roomID)
    })

    
    socket.on('remaining_status',(u,p1,p2,mut)=>{
        // socket.broadcast.to(socket.roomID).emit('receive_status',u,p1,p2,mut);
        socket.broadcast.emit('receive_status',u,p1,p2,mut,socket.roomID);
    })
    
    socket.on('statusOfMute',(p,ms)=>{
        // socket.person = p
        // socket.broadcast.to(socket.roomID).emit('sm',p,ms)
        socket.broadcast.emit('sm',p,ms,socket.roomID)
    })

})

server.listen(port)