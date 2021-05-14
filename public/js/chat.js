const socket = io();
const messages = document.querySelector("#msg");
const sendButton = document.querySelector("#sendText");
const input = document.querySelector("input");
const name = document.querySelector("#name");
const sendFile = document.querySelector("#sendFile");
let myVideo = document.querySelector("#me");
let otherVideo;
const videoContainer = document.querySelector("#video-container");
const endCallButton = document.querySelector("#endCallButton");
const cameraButton = document.querySelector("#cameraButton");
const micButton = document.querySelector("#micButton");

let sendVideo = true;
let sendAudio = true;
let audioTrack, audioTrack2, videoTrack, videoTrack2;
const myPeer = new Peer();
myPeer.on("open", function (id) {
  console.log("My peer ID is: " + id);
  socket.emit("userConnected", {
    peerId: id,
    roomId: roomId,
  });
});
//send data test
// myPeer.on("connection", (conn) => {
//   conn.on("data", (data) => {
//     console.log("receiving data");
//     console.log(data);
//   });
// });

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

socket.on("cameraClicked", ({ a, v }) => {
  console.log(v);
  videoStream = otherVideo.srcObject;
  if (a) {
    videoStream.addTrack(audioTrack2);
  } else videoStream.removeTrack(audioTrack2);
  if (v) {
    console.log("works");
    videoStream.addTrack(videoTrack2);
    if (!otherVideo.parentElement) otherVideo = createVideo(videoStream);
  } else {
    videoStream.removeTrack(videoTrack2);
    if (otherVideo.parentElement) removeVideo(otherVideo);
    if (a) createVideo(videoStream, false);
  }
});

// receiving call request and answering it
navigator.mediaDevices
  .getUserMedia({ video: sendVideo, audio: sendAudio })
  .then((stream) => {
    [audioTrack, videoTrack] = stream.getTracks();
    if (!sendVideo) {
      stream.removeTrack(videoTrack);
    }
    if (!sendAudio) {
      stream.removeTrack(audioTrack);
    }
    myVideo.srcObject = stream.clone();
    myVideo.srcObject.removeTrack(myVideo.srcObject.getTracks()[0]);
    myVideo.play();
    cameraButton.addEventListener("click", () => {
      sendVideo = !sendVideo;
      console.log("clicked");
      socket.emit("cameraClicked", {
        v: sendVideo,
        a: sendAudio,
        roomId: roomId,
      });
      if (sendVideo) {
        stream.addTrack(videoTrack);
        myVideo = createVideo(stream);
        myVideo.srcObject = stream.clone();
        myVideo.srcObject.removeTrack(myVideo.srcObject.getTracks()[0]);
        myVideo.play();
      } else {
        stream.removeTrack(videoTrack);
        removeVideo(myVideo);
      }
    });
    micButton.addEventListener("click", () => {
      sendAudio = !sendAudio;
      console.log("clicked");
      socket.emit("cameraClicked", {
        v: sendVideo,
        a: sendAudio,
        roomId: roomId,
      });
      // if (sendAudio) {
      //   stream.addTrack(videoTrack);
      //   myVideo = createVideo(stream);
      //   myVideo.srcObject = stream.clone();
      //   myVideo.srcObject.removeTrack(myVideo.srcObject.getTracks()[0]);
      //   myVideo.play();
      // } else {
      //   stream.removeTrack(videoTrack);
      //   removeVideo(myVideo);
      // }
    });
    myPeer.once("call", (call) => {
      call.answer(stream);
      call.once("stream", (userVideoStream) => {
        otherVideo = createVideo(userVideoStream);
        [audioTrack2, videoTrack2] = userVideoStream.getTracks();
        otherVideo.addEventListener("loadedmetadata", () => {
          otherVideo.play();
        });
      });
      call.once("close", () => {
        otherVideo.parentElement.removeChild(otherVideo);
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        socket.emit("callClosed", { roomId: roomId });
      });
      socket.once("callClosed", () => {
        otherVideo.parentElement.removeChild(otherVideo);
        // document.location.href = "../";
      });
    });

    // sending call request
    socket.once("userConnected", (peerId) => {
      console.log(`calling user ${peerId}`);
      const conn = myPeer.connect(peerId);
      sendFile.onchange = (event) => {
        const file = event.target.files[0];
        const blob = new Blob(event.target.files, { type: file.type });
        conn.send({
          file: blob,
          fileName: file.name,
          fileType: file.type,
        });
      };
      const call = myPeer.call(peerId, stream);
      call.once("stream", (videoStream) => {
        [audioTrack2, videoTrack2] = videoStream.getTracks();
        console.log("videoStream recieved");
        ////////setting up video for first connection///////////////////////////////////////////////
        if (otherVideo === undefined) otherVideo = createVideo(videoStream);
        else otherVideo.srcObject = videoStream;
        ///////////////////////////////////////////////////////
      });
      call.once("close", () => {
        otherVideo.parentElement.remove(otherVideo);
      });
      socket.once("callClosed", () => {
        otherVideo.parentElement.remove(otherVideo);
        // document.location.href = "../";
      });
      endCallButton.addEventListener("click", () => {
        call.close();
        otherVideo.parentElement.removeChild(otherVideo);
        socket.emit("callClosed", { roomId: roomId });
      });
    });
  })
  .catch(function (err) {
    console.log("An error occurred: " + err);
  });
// endCallButton.addEventListener("click", () => {
//   document.location.href = "../";
// });
function createVideo(stream, video = true) {
  v = document.createElement("video");
  v.srcObject = stream;
  v.style = video ? "width:350px" : "width:0px";
  videoContainer.appendChild(v);
  v.addEventListener("loadedmetadata", () => {
    v.play();
  });
  return v;
}
function removeVideo(v) {
  v.parentElement.removeChild(v);
}
// function createAudio(audioStream) {
//   v = document.createElement("video");
//   v.srcObject = audioStream;
//   videoContainer.appendChild(a);
//   a.addEventListener("loadedmetadata", () => {
//     a.play();
//     return a;
//   });
// }
