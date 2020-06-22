// importing modules
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}

// connecting to mongodb server
const URL = "mongodb://localhost:27017/usersDB";
mongoose.connect(URL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
  useCreateIndex: true
});
const sessionStore = new MongoStore({
  mongooseConnection: mongoose.connection
})
// getting env variables
const SECRET = process.env.SECRET;
const COOKIE_NAME = process.env.COOKIE_NAME;

// creating an express app
const app = express();

// setting ejs as view engine
app.set("view engine", "ejs");
// using body-parser and static files
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
// using express-session and passport
app.use(session({
  name: COOKIE_NAME,
  secret: SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}));
app.use(passport.initialize());
app.use(passport.session());

// creating a mongoose schema for users collection
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
// plugin passport-local-mongoose
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email"
});
// creating a new user model
const User = new mongoose.model("User", userSchema);
// using a configured passport-local LocalStrategy
passport.use(User.createStrategy());
// using static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// storing ports for production and development
const PORT = (process.env.PORT || 3000);

// disabling caching for /secrets route
app.use("/secrets", function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

// handling GET request to / route
app.get("/", function(req, res) {
  res.render("home");
});

// handling GET request to /register route
app.get("/register", function(req, res) {
  res.render("register");
});

// handling GET request to /secrets route
app.get("/secrets", function(req, res) {
  // rendering secrets page if user is loggin in
  if (req.isAuthenticated()) {
    res.render("secrets");
    // redirecting to login page for unauthenticated user
  } else {
    res.redirect("/login");
  }
});

// handling GET request to /login route
app.get("/login", function(req, res) {
  // redirecting to secrets page if user is already loggin in
  if (req.isAuthenticated()) {
    res.redirect("/secrets");
    // rendering login page for unauthenticated user
  } else {
    res.render("login");
  }
});

// handling GET request to /logout route
app.get("/logout", function(req, res) {
  // removing user from session
  req.logout();
  // clearing cookie from browser
  res.clearCookie(COOKIE_NAME);
  // removing the current session
  req.session.destroy(function(err) {
    if (!err) {
      res.redirect("/");
    }
  });
});

// function to establish session for registered or authenticated user
function signIn(user, req, res) {
  req.login(user, function(err) {
    if (err) {
      console.log("LogIn error : " + err);
    } else {
      res.redirect("/secrets");
    }
  });
}

// handling POST request to /register route
app.post("/register", function(req, res) {
  // getting user entered form data
  const user = {
    email: req.body.email,
    password: req.body.password
  };
  // registering new user to our database
  User.register({
    email: user.email
  }, user.password, function(err, user) {
    if (err) {
      // redirecting to register page in case of error
      console.log("Registration error : " + err);
      res.redirect("/register");
    } else {
      // signing in the new user and establishing a session
      signIn(user, req, res);
    }
  });
});

// handling POST request to /login route
app.post("/login", function(req, res) {
  // authenticating user login
  passport.authenticate("local", function(err, user, info) {
    if (err) {
      console.log(err);
    } else {
      if (!user) {
        // redirecting to login page in case of incorrect username or password
        console.log("Authentication error : " + info);
        res.redirect("/login");
      } else {
        // signing in the new user and establishing a session
        signIn(user, req, res);
      }
    }
  })(req, res);
});

// starting server on port
app.listen(PORT, function() {
  console.log("Server started on port " + PORT);
});
