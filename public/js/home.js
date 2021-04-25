imagesList = [
  "images/background/image1.jpeg",
  "images/background/image2.jpeg",
  "images/background/image3.jpeg",
  "images/background/image4.jpeg",
  "images/background/image5.jpeg",
];
let createMeetingButton = document.querySelector("#content1");
console.log(imagesList);
var i = 0;
setInterval(() => {
  document.body.style.backgroundImage = `url(${imagesList[i % 5]})`;
  setTimeout(() => {
    i = i + 1;
  }, 1000);
  // setTimeout(()=>{
  //     imagesList[i].style.opacity=1;
  //     console.log(i)
  //     i = i+ 1 ;
  // },1000);
  // imagesList[i].style.opacity=0;
  //i=i+1;
  if (i == imagesList.length - 1) {
    clearInterval();
  }
}, 2000);
createMeetingButton.addEventListener("click", () => {
  document.location.href = "/home/chat";
});
