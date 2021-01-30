const express = require("express"),
  http = require("http"),
  app = express(),
  socketio = require("socket.io"),
  server = http.createServer(app),
  io = socketio(server),
  User = require("./models/User"),
  mongoose = require("mongoose"),
  bodyparser = require("body-parser"),
  passport = require("passport"),
  uuidv4 = require("uuid").v4,
  localStrategy = require("passport-local");
mongoose.connect(process.env.MONGODB_URL || "mongodb://localhost/PHASE1", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let port = process.env.PORT || 3000;
app.set("view engine", "ejs");
app.use(
  require("express-session")({
    secret: "mark",
    saveUninitialized: false,
    resave: false,
  })
);
app.use(express.static("public"));
app.use(express.static("node_modules"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
/////////////////////////////////////////////////////////
//routes/////////////////////////////////////////////////
/////////////////////////////////////////////////////////
function isLogged(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

io.on("connection", (socket) => {
  socket.on("joinRoom", (data) => {
    socket.join(data.roomId);
    socket.broadcast
      .to(data.roomId)
      .emit("chatMessage", `user ${data.username} joined the chat`);
  });
  socket.on("chatMessage", (text) => {
    console.log(text);
    var msg = `${text.name}: ${text.data}`;
    io.to(text.roomId).emit("chatMessage", msg);
  });
  socket.on("userConnected", (data) => {
    socket.broadcast.to(data.roomId).emit("userConnected", data.peerId);
  });
  socket.on("callClosed", (data) => {
    socket.broadcast.to(data.roomId).emit("callClosed");
  });
});

/////////////////Get requests////////////////////////////

app.get("/login", (req, res) => {
  if (req.isAuthenticated()) res.redirect("/home");
  else res.render("index");
});

app.get("/home", isLogged, (req, res) => {
  res.render("home", { user: req.user });
});

app.get("/home/chat", isLogged, (req, res) => {
  res.redirect(`/home/chat/${uuidv4()}`);
});

app.get("/home/chat/:id", isLogged, (req, res) => {
  res.render("chat", { user: req.user, roomId: req.params.id });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/login");
});

/////////////////Post requests////////////////////////////

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  }),
  (req, res) => {}
);

app.post(
  "/sign_up",
  (req, res, next) => {
    if (req.body.password === req.body.passwordRe) return next();
    res.redirect("/login");
  },
  (req, res) => {
    User.register(
      new User({
        username: req.body.username,
      }),
      req.body.password,
      (err, user) => {
        if (err) {
          console.log(err);
          return res.render("index");
        }
        user.firstName = req.body.firstName;
        user.lastName = req.body.lastName;
        user.save();
        console.log(user);
        passport.authenticate("local")(req, res, function () {
          res.redirect("/home");
        });
      }
    );
  }
);

//////////////////////////////////////////////////////////
app.get("*", (req, res) => {
  res.redirect("/login");
});
server.listen(port, () => {
  console.log("listening on http://localhost:3000/login");
});
