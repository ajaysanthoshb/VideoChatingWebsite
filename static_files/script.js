const socket = io()
var persons_counter=0;
var person,myStream;
var mute_on = true;
var video_off = true,chat_on = true;
var mute_button = document.getElementById('ele1')
var video_button = document.getElementById('ele2')
var chat_button = document.getElementById('ele3')
var h_ele = document.getElementsByTagName('h5')[0].textContent


var our_user_id;
// var temp_arr
var b1 = true,b2 = true;
do{
    if(person)
    {
        if(person.length > 13)
        {
            person = prompt('Name should contain max 13 letters')
        }
    }
    else{
        person = prompt('Enter your name(without numbers)')
    }
    person = person.trim()
    person = person.replace(/[0-9]/g, '')
}while(person.length <= 0 || person.length > 13)

console.log(h_ele)
person += `(${h_ele})`
socket.emit('send_person',person)


var ROOM_ID , call_receiver, user_attribute

//huge elements
var video_grid = document.getElementById("videogrid")
var chatting = document.querySelector('.chatting')
var container = document.querySelector('.container')
var video_header = document.querySelector('#video_header')
var brand = document.querySelector('.brand')
var persons = document.querySelector('#persons')

addstatus(person,"mine")
var m = true
const sideBar = document.getElementById("side-bar");


function closeSidebar(){
    sideBar.setAttribute("data-state","close");
}

function openSidebar(){
    sideBar.setAttribute("data-state","open");
}

const peers = {}
var arr = []
var counter = -1
var mute_status = true
const my_video = document.createElement('video')
var id_storer;

//myself muting to avoid echo but audible to others
my_video.muted  = true

// const peer = new Peer(undefined ,{host:'/',port:3001})
const peer = new Peer(undefined,{host:'peerjs-server.herokuapp.com', secure:true, port:443})

var previous_name,color_index=-1,previous_msg_incomer_name;
var color_array = ['hsl(180,40%,40%)','hsl(180,50%,55%)','hsl(220,60%,70%)','hsl(220,30%,50%)','hsl(200,70%,60%)']
var str = `background:${color_array[color_index]}`
let textarea = document.getElementById('textarea')
let msg_area = document.querySelector('.msg_area')
let send_button = document.querySelector('#send_button')


socket.on('send_room_id',(roomID)=>{
    ROOM_ID = roomID
    // peer server Listening for peer and server generates id for peer
    peer.on('open',(id)=>{
        our_user_id = id
        console.log('USERID : ', id)
        socket.emit('join-room',ROOM_ID,id)
        socket.emit('status',person,our_user_id)
    })
})



navigator.mediaDevices.getUserMedia({
    video:true,audio:{
        echoCancellation : true,
        noiseSuppression : true,
        sampleRate: 44100
    }
}).then((stream) =>{
    myStream = stream
    console.log("Getuser media function")
    addVideoStream(my_video,stream,"mine")
    peer.on('connection',(conn)=>{
        conn.on('data',(sender_userID)=>{
            arr.push(sender_userID)
            console.log("Id storer = ",arr[arr.length-1])
        })
    })
    //This call function executes when P1 calls to P2..
    peer.on('call',(call)=>{

        call_receiver = call
        //Sending stream to P1
        console.log('Sending stream to P1')
        call.answer(stream)
        console.log(call)
        var new_video = document.createElement('video')

        //new user receiving our stream
        call.on('stream',receiver_receiving=>{
            if(m)
            {
                counter++
                m = false
            }
            else{
                m = true
            }
            console.log('Receiving stream from P1')
            console.log('counter',counter)
            console.log("ID storer = ",arr[counter])
            addVideoStream(new_video,receiver_receiving,arr[counter])
        })
    })

   
    socket.on('user-connected',(userID,r)=>{
        if(r == ROOM_ID)
        {
            setTimeout(connectToNewUser,100,userID,stream)
        }
        // connectToNewUser(userID,stream)
    })

})



socket.on('broadcast_status',(p,u,r)=>{
    if(r == ROOM_ID)
    {   
        console.log("person = ",p)
        console.log("user = ",u)
        socket.emit('remaining_status',our_user_id,person,p,mute_status)
        addstatus(p,u)
    }
})

function addleftpopup(p){
    let x = document.getElementsByTagName('h4').length
    for(let i = 0;i < x;i++){
        document.getElementsByTagName('h4')[i].remove()
    }
    let y = document.createElement('h4')
    y.innerText = `${p} left the meeting`
    document.getElementsByTagName('body')[0].append(y)
}

socket.on('receive_status',(u,p1,p2,cut,r)=>{
    if(r == ROOM_ID)
    {
        if (p2 == person){
            if(cut == false)
            {
                addstatus(p1,u,"mic")
            }
            else{
                addstatus(p1,u)
            }
        }
    }
})

function addstatus(p,u,m="mic_off")
{
    var diving = document.createElement('h2')
    diving.setAttribute('id',u);
    if(m == "mic_off")
    {
        let s = `${p} : <i class='material-icons' id = ${p} style = 'color:white; border:1px solid red; border-radius:50%; background : red; padding : 3px;'>${m}</i>`
        diving.innerHTML = s
        persons.appendChild(diving)
    }
    else{
        let s = `${p} : <i class='material-icons' id = ${p} style = 'color:white; border:1px solid black; border-radius:50%; background : black; padding : 3px;'>${m}</i>`
        diving.innerHTML = s
        persons.appendChild(diving)
    }
}







function connectToNewUser(userID, stream){

    var conn = peer.connect(userID)
    conn.on('open',()=>{
        console.log("Our user id = ",our_user_id)
        conn.send(our_user_id)
    })

    setTimeout(calling_to_peer,300,userID,stream)
}

function calling_to_peer(userID,stream)
{
    //Calling to P2 and sending our stream simultaneously
    console.log('P1 Calling to P2 and sending P1 stream to P2')
    const call = peer.call(userID,stream)
    const vid = document.createElement('video')
    //P1 receiving the stream from P2
    call.on('stream',(userVideoStream) => {
        console.log('P1 receiving the stream from P2')
        addVideoStream(vid,userVideoStream,userID)
    })
    call.on('close',()=>{
        vid.remove()
    })
    console.log("Testing")

    peers[userID] = call
}

function addVideoStream(my_video,stream,person){
    my_video.srcObject = stream
    my_video.setAttribute('id',person)
    my_video.addEventListener('loadedmetadata',()=>{
        my_video.play()
    })
    persons_counter += 1
    video_grid.append(my_video)
    if(person == "mine"){
        myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);
        myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled);
    }
}

function updateStatus(p,mut){
    console.log("mute status",mut)
    let x = document.getElementsByTagName("i").length;
    for(let i = 0; i < x;i++){
        let y = document.getElementsByTagName("i")
        if(y[i].id == p){
            // 'color:white; border:1px solid red;
            //  border-radius:50%; 
            //  background : red;
            //   padding : 3px;'
            if(mut)
            {
               y[i].style.borderColor = "red"
               y[i].style.backgroundColor = "red"
               y[i].innerText = "mic_off"
            }
            else{
               y[i].style.borderColor = "black"
               y[i].style.backgroundColor = "black"
               y[i].innerText = "mic"
            }
        }
    }
}

socket.on('user-disconnected',(p,userID,r) =>{
    if(r == ROOM_ID)
    {
        addleftpopup(p)
        var ele = document.getElementById(userID)
        if(ele){
            ele.remove()
        }

        //closing the connection
        if(peers[userID])
        {
            peers[userID].close()
        }

        delete_sideElement(userID)
    }
    
})

function delete_sideElement(u){
    let x = document.getElementsByTagName("h2").length;
    for(let i = 0; i < x;i++){
        if(document.getElementsByTagName("h2")[i].id == u){
            document.getElementsByTagName("h2")[i].remove()
            break
        }
    }
}

var append_msg = (msg,className) =>{
    let mainDiv = document.createElement('div')
    mainDiv.classList.add(className)
    let markup;
    if(className == "incoming_msg")
    {
        if (previous_name == msg.user){
            if (previous_msg_incomer_name == msg.user)
            {
                markup = `
                <p style = "${str}">${msg.message}</p>
            `}
            else{
                color_index = (color_index+1)%5
                str = `background:${color_array[color_index]}`
                markup = `
                <p style = "${str}">${msg.message}</p>
            `
            }
        }
        else
        {
            if(previous_msg_incomer_name == msg.user)
            {
                markup = `
                <h3>${msg.user}</h3>
                <p style = "${str}">${msg.message}</p>
            `}
            else{
                color_index = (color_index+1)%5
                str = `background:${color_array[color_index]}`
                markup = `
                <h3>${msg.user}</h3>
                <p style = "${str}">${msg.message}</p>`
            }
        }
        previous_msg_incomer_name = msg.user
    }
    else{
        if (previous_name == msg.user){
            markup = `
            <p>${msg.message}</p>
        `
        }
        else
        {
            markup = `
            <h3>${msg.user}</h3>
            <p>${msg.message}</p>
        `
        }
    }
    

    mainDiv.innerHTML = markup

    msg_area.appendChild(mainDiv)

    previous_name = msg.user
    
}
var sendmsg = (msg) =>{
    let text_msg = {
        user : person,
        message : msg.trim()
    }

    if (text_msg.message.length > 0){
        //append
        append_msg(text_msg,"outgoing_msg")

        //Clearing text in textarea
        textarea.value = ''

        //scroll down to current msg
        msg_area.scrollTop = msg_area.scrollHeight

        //send to server
        socket.emit('message',text_msg,ROOM_ID)
    }
}


textarea.addEventListener('keyup',(e)=>{
    if(e.key == "Enter"){
        let cleanText = e.target.value.replace(/<\/?[^>]+(>|$)/g, "");
        sendmsg(cleanText)
    }
})

send_button.addEventListener('click',()=>{
    let cleanText = textarea.value.replace(/<\/?[^>]+(>|$)/g, "");
    sendmsg(cleanText)
})
//Receiving msgs

socket.on('broadcast_msg',(mesage,other_room_id,r)=>{
    if(r == ROOM_ID)
    {
        console.log(other_room_id)
        console.log(ROOM_ID)
        if(ROOM_ID == other_room_id)
        {
            append_msg(mesage,'incoming_msg')

            //scroll down to current msg
            msg_area.scrollTop = msg_area.scrollHeight
        }
    } 
})


mute_button.addEventListener('click',()=>{
    if(mute_on){
        mute_button.src = "./images/mute-off.png"
        mute_button.style.backgroundColor = "white"
        mute_on = false
    }
    else{
        mute_button.src = "./images/mute_on.png"
        mute_button.style.backgroundColor = "red"
        mute_on = true
    }
    if(mute_status)
    {
        mute_status = false
    }
    else{
        mute_status = true
    }
    updateStatus(person,mute_status)
    socket.emit("statusOfMute",person,mute_status)
    myStream.getAudioTracks()[0].enabled = !(myStream.getAudioTracks()[0].enabled);

})


socket.on('sm',(p,ms,r)=>{
    if(r == ROOM_ID)
    {
        updateStatus(p,ms)
    }
})



video_button.addEventListener('click',()=>{
    if(video_off){
        video_button.src = "./images/video_on.png"
        video_button.style.backgroundColor = "white"
        video_off = false
    }
    else{
        video_button.src = "./images/video_off.png"
        video_button.style.backgroundColor = "red"
        video_off = true
    }
    myStream.getVideoTracks()[0].enabled = !(myStream.getVideoTracks()[0].enabled);
})

chat_button.addEventListener('click',()=>{
    if(chat_on){
        chat_button.src = "./images/chat_off.png"
        chat_button.style.boxShadow = "0px 2px 15px black"
        chat_button.style.borderColor = "black"
        chatting.style.display = "none"
        video_grid.style.width = "100%"
        video_header.style.width = "100%"
        brand.style.display = "none"
        // grid-template-columns: repeat(2,45%);
        // grid-column-gap: 10%;
        video_grid.style.gridTemplateColumns = "repeat(3,30%)"
        video_grid.style.gridColumnGap = "3%";
        chat_on = false
    }
    else{
        chat_button.src = "./images/chat_on.png"
        chat_button.style.boxShadow = "0px 2px 15px #5c0ccc"
        chat_button.style.borderColor = "#5c0ccc"
        chatting.style.display = "block"
        video_grid.style.width = "60%"
        video_header.style.width = "60%"
        brand.style.display = "flex"
        video_grid.style.gridTemplateColumns = "repeat(2,45%)"
        video_grid.style.gridColumnGap = "7%";
        chat_on = true
    }
})



