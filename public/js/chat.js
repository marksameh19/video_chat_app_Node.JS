const socket = io();
const messages = document.querySelector("#msg");
const sendButton = document.querySelector("button");
const input = document.querySelector("input");
const name = document.querySelector("#name");
const myVideo = document.querySelector("#me");
const otherVideo = document.querySelector("#them");
const endCallButton = document.querySelector("#endCallButton");

const myPeer = new Peer();
myPeer.on("open", function (id) {
  console.log("My peer ID is: " + id);
  socket.emit("userConnected", {
    peerId: id,
    roomId: roomId,
  });
});

socket.on("chatMessage", (message) => {
  outputMessage(message);
});

socket.emit("joinRoom", {
  roomId: roomId,
  username: `${userFirstName} ${userLastName}`,
});

sendButton.addEventListener("click", () => {
  socket.emit("chatMessage", { data: input.value, name: user, roomId: roomId });
});

const outputMessage = (message) => {
  var p = document.createElement("p");
  p.innerText = message;
  messages.appendChild(p);
};

// receiving call request and answering it
navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then((stream) => {
    myVideo.srcObject = stream;
    myVideo.play();
    myPeer.on("call", (call) => {
      call.answer(stream);
      call.on("stream", (userVideoStream) => {
        otherVideo.srcObject = userVideoStream;
        otherVideo.addEventListener("loadedmetadata", () => {
          otherVideo.play();
        });
      });
      call.on("close", () => {
        otherVideo.remove();
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        otherVideo.remove();
        socket.emit("callClosed", { roomId: roomId });
        document.location.href = "../";
      });
      socket.on("callClosed", () => {
        otherVideo.remove();
        document.location.href = "../";
      });
    });

    // sending call request
    socket.on("userConnected", (peerId) => {
      console.log(`calling user ${peerId}`);
      const call = myPeer.call(peerId, stream);
      call.on("stream", (videoStream) => {
        console.log("videoStream recieved");
        otherVideo.srcObject = videoStream;
        otherVideo.addEventListener("loadedmetadata", () => {
          otherVideo.play();
        });
      });
      call.on("close", () => {
        otherVideo.remove();
      });
      socket.on("callClosed", () => {
        otherVideo.remove();
        document.location.href = "../";
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        otherVideo.remove();
        socket.emit("callClosed", { roomId: roomId });
        document.location.href = "../";
      });
    });
  })
  .catch(function (err) {
    console.log("An error occurred: " + err);
  });
// endCallButton.addEventListener("click", () => {
//   document.location.href = "../";
// });
