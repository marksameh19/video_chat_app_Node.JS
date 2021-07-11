const socket = io();
const messages = document.querySelector(".chats");
const sendButton = document.querySelector(".send-button");
const input = document.querySelector(".txt-area");
const name = document.querySelector("#name");
const sendFile = document.querySelector("#sendFile");
let myVideo = document.querySelector("#me");
let otherVideo = document.querySelector("#them");
const videoContainer = document.querySelector("#video-container");
const endCallButton = document.querySelector("#endCallButton");
const cameraButton = document.querySelector("#cameraButton");
const micButton = document.querySelector("#micButton");
let readChatButton = document.querySelector("#readChatButton");
let sendVideo = camera;
let sendAudio = mic;
let audioTrack, audioTrack2, videoTrack, videoTrack2;
let readChat = true;
const myPeer = new Peer();
myPeer.on("open", function (id) {
  console.log("My peer ID is: " + id);
  socket.emit("userConnected", {
    peerId: id,
    roomId: roomId,
  });
});
let readChatFunction = () => {
  if (readChat) {
    readChatButton.classList.add("btn-info");
    readChatButton.classList.remove("btn-danger");
    readChatButton.innerText = "read Chat";
  } else {
    readChatButton.classList.remove("btn-info");
    readChatButton.classList.add("btn-danger");
    readChatButton.innerText = "mute Chat";
  }
  readChat = !readChat;
};
readChatButton.addEventListener("click", readChatFunction);
//send data test
// myPeer.on("connection", (conn) => {
//   conn.on("data", (data) => {
//     console.log("receiving data");
//     console.log(data);
//   });
// });

socket.on("chatMessage", (message) => {
  if (readChat) responsiveVoice.speak(message.data, "UK English Female");
  outputMessage(
    message.data,
    "left",
    "https://bootdey.com/img/Content/avatar/avatar1.png",
    message.date
  );
});
let now = new Date();
socket.emit("joinRoom", {
  username: `${userFirstName} ${userLastName}`,
  data: `user ${userFirstName} ${userLastName} joined the chat`,
  date: now.toLocaleString(),
  name: user,
  roomId: roomId,
});

sendButton.addEventListener("click", () => {
  let date = new Date();
  // var dateString = moment(date).format("LTS");
  socket.emit("chatMessage", {
    data: input.value,
    date: date.toLocaleString(),
    name: user,
    roomId: roomId,
  });
  outputMessage(
    input.value,
    "right",
    "https://bootdey.com/img/Content/avatar/avatar2.png",
    date.toLocaleString()
  );
});

const outputMessage = (message, placement, imageSrc, time) => {
  let chat = document.createElement("div");
  chat.classList.add("chat");
  if (placement === "left") chat.classList.add("chat-left");
  let chatBody = document.createElement("div");
  chatBody.classList.add("chat-body");
  let chatContent = document.createElement("div");
  chatContent.classList.add("chat-content");
  let chatAvatar = document.createElement("div");
  chatAvatar.classList.add("chat-avatar");
  let a = document.createElement("a");
  let i = document.createElement("i");
  let img = document.createElement("img");
  img.src = imageSrc;
  a.className += "avatar avatar-online";
  a.setAttribute("data-toggle", "tooltip");
  a.setAttribute("href", "#");
  a.setAttribute("data-placement", placement);
  a.appendChild(img);
  a.appendChild(i);
  chatAvatar.appendChild(a);
  chat.appendChild(chatAvatar);
  let p = document.createElement("p");
  p.innerText = message;
  let t = document.createElement("time");
  t.dateTime = time;
  t.innerText = time;
  chatContent.appendChild(p);
  chatContent.appendChild(t);
  chatBody.appendChild(chatContent);
  chat.appendChild(chatBody);
  messages.appendChild(chat);
};

// receiving call request and answering it
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    [audioTrack, videoTrack] = stream.getTracks();
    let myStream = stream.clone();
    if (mic == false) {
      myStream.getTracks()[0].enabled = false;
      stream.getTracks()[0].enabled = false;
    }
    if (camera == false) {
      myStream.getTracks()[1].enabled = false;
      stream.getTracks()[1].enabled = false;
    }
    myVideo.srcObject = myStream;
    myVideo.srcObject.removeTrack(myVideo.srcObject.getTracks()[0]);
    myVideo.play();
    cameraButton.addEventListener("click", () => {
      if (sendVideo == true) {
        videoTrack.enabled = false;
        myStream.getTracks()[0].enabled = false;
      } else {
        videoTrack.enabled = true;
        myStream.getTracks()[0].enabled = true;
      }
      sendVideo = !sendVideo;
    });
    micButton.addEventListener("click", () => {
      if (sendAudio == true) {
        audioTrack.enabled = false;
      } else audioTrack.enabled = true;
      sendAudio = !sendAudio;
    });
    myPeer.on("call", (call) => {
      call.answer(stream);
      call.once("stream", (userVideoStream) => {
        [audioTrack2, videoTrack2] = userVideoStream.getTracks();
        otherVideo.srcObject = userVideoStream;
        otherVideo.addEventListener("loadedmetadata", () => {
          otherVideo.play();
        });
      });
      call.once("close", () => {
        videoTrack2.enabled = false;
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        socket.emit("callClosed", { roomId: roomId });
      });
      socket.once("callClosed", () => {
        videoTrack2.enabled = false;
      });
    });

    // sending call request
    socket.on("userConnected", (peerId) => {
      console.log(`calling user ${peerId}`);
      const conn = myPeer.connect(peerId);
      // sendFile.onchange = (event) => {
      //   const file = event.target.files[0];
      //   const blob = new Blob(event.target.files, { type: file.type });
      //   conn.send({
      //     file: blob,
      //     fileName: file.name,
      //     fileType: file.type,
      //   });
      // };
      const call = myPeer.call(peerId, stream);
      call.once("stream", (videoStream) => {
        [audioTrack2, videoTrack2] = videoStream.getTracks();
        ////////setting up video for first connection///////////////////////////////////////////////
        otherVideo.srcObject = videoStream;
        ///////////////////////////////////////////////////////
      });
      call.once("close", () => {
        videoTrack2.enabled = false;
      });
      socket.once("callClosed", () => {
        //otherVideo.parentElement.remove(otherVideo);
        videoTrack2.enabled = false;
        // document.location.href = "../";
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        socket.emit("callClosed", { roomId: roomId });
      });
    });
  })
  .catch(function (err) {
    console.log("An error occurred: " + err);
  });
