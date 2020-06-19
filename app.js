// importing modules
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}

// creating an express app
const app = express();

// using body-parser and static files
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
// setting ejs as view engine
app.set("view engine", "ejs");

// storing ports for production and development
const PORT = (process.env.PORT || 3000);

// storing the number of salting rounds
const saltRounds = 10;

// connecting to mongodb server
const URL = "mongodb://localhost:27017/usersDB";
mongoose.connect(URL, {
  useNewUrlParser: true,
  useFindAndModify: false,
  useUnifiedTopology: true
});

// creating a mongoose schema for users collection
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// creating a new user model
const User = new mongoose.model("User", userSchema);

// handling GET request to / route
app.get("/", function(req, res) {
  res.render("home");
});

// handling GET request to /register route
app.get("/register", function(req, res) {
  res.render("register");
});

// handling GET request to /login route
app.get("/login", function(req, res) {
  res.render("login");
});

// handling POST request to /register route
app.post("/register", function(req, res) {
  const userData = {
    email: req.body.email,
    password: req.body.password
  };
  User.findOne({
    email: userData.email
  }, function(err, docs) {
    if (!err) {
      if (docs) {
        res.send("Email exists!");
      } else {
        bcrypt.hash(user.password, saltRounds, function(err, hash) {
          if (!err) {
            const user = new User({
              email: userData.email,
              password: hash
            });
            user.save(function(err) {
              if (!err) {
                res.render("secrets");
              }
            });
          }
        });
      }
    }
  });
});

// handling POST request to /login route
app.post("/login", function(req, res) {
  const user = {
    email: req.body.email,
    password: req.body.password
  };
  User.findOne({
    email: user.email
  }, function(err, docs) {
    if (!err) {
      if (docs) {
        bcrypt.compare(user.password, docs.password, function(err, match) {
          if (match) {
            res.render("secrets");
          } else {
            res.send("Incorrect password!");
          }
        });
      } else {
        res.send("No users found!");
      }
    }
  });
});

// starting server on port
app.listen(PORT, function() {
  console.log("Server started on port " + PORT);
});
