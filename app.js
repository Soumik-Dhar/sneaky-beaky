// importing modules
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const findOrCreate = require('mongoose-findorcreate')
const session = require('express-session');
const flash = require('express-flash');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const config = require(__dirname + '/config.js');

// connecting to mongodb server
mongoose.connect(config.URL, config.mongooseConnectionOptions);
const sessionStore = new MongoStore({
  mongooseConnection: mongoose.connection
});

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
  name: config.cookieName,
  secret: config.cookieSecret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
}));
app.use(passport.initialize());
app.use(passport.session());
// using expres-flash
app.use(flash());

// creating a mongoose schema for users collection
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  provider: String,
  password: String,
  profileId: String,
  secret: String
});
// plugin passport-local-mongoose
userSchema.plugin(passportLocalMongoose, config.passportLocalMongooseOptions);
// plugin findOrCreate
userSchema.plugin(findOrCreate);

// creating a new user model
const User = new mongoose.model("User", userSchema);

// function to find or create users in our database after oAuth transaction
function addUser(profile, done) {
  User.findOrCreate({
    name: (profile._json.name || "None"),
    email: (profile._json.email || profile.profileUrl || "None"),
    provider: profile.provider,
    profileId: profile.id
  }, function(err, user) {
    return done(err, user);
  });
}

// using a configured passport-local LocalStrategy
passport.use(User.createStrategy());

// using passport-google-oauth strategy
passport.use(new GoogleStrategy(config.googleOptions,
  function(accessToken, refreshToken, profile, done) {
    addUser(profile, done);
  }
));

// using passport-facebook strategy
passport.use(new FacebookStrategy(config.facebookOptions,
  function(accessToken, refreshToken, profile, done) {
    addUser(profile, done);
  }
));

// using passport-github strategy
passport.use(new GitHubStrategy(config.githubOptions,
  function(accessToken, refreshToken, profile, done) {
    addUser(profile, done);
  }
));

// using static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
  done(null, user.id);
});
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// storing ports for production and development
const PORT = (process.env.PORT || 3000);

// storing redirect routes for failure
const failureRedirects = {
  failureRedirect: "/login",
  // failureFlash: true
};

// function to redirect to secrets page after authentication
function openSecrets(req, res) {
  req.flash("secrets", "Logged in successfully!");
  res.redirect("/secrets");
}

// disabling caching for /secrets route
app.use("/secrets", function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});

// handling GET request to / route
app.get("/", function(req, res) {
  res.render("home");
});

////////// route handlers for google oAuth //////////
app.get("/auth/google", passport.authenticate("google", config.googleScope));
app.get("/auth/google/sneakybeaky", passport.authenticate("google", failureRedirects), function(req, res) {
  // redirecting to secrets page after login
  openSecrets(req, res);
});

////////// route handlers for facebook oAuth //////////
app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/sneakybeaky", passport.authenticate("facebook", failureRedirects), function(req, res) {
  // redirecting to secrets page after login
  openSecrets(req, res);
});

////////// route handlers for github oAuth //////////
app.get("/auth/github", passport.authenticate("github", config.githubScope));
app.get("/auth/github/sneakybeaky", passport.authenticate("github", failureRedirects), function(req, res) {
  // redirecting to secrets page after login
  openSecrets(req, res);
});

// handling GET request to /register route
app.get("/register", function(req, res) {
  res.render("register");
});

// handling GET request to /secrets route
app.get("/secrets", function(req, res) {
  // rendering secrets page if user is logged in
  if (req.isAuthenticated()) {
    User.find({
      secret: {
        $ne: null
      }
    }, function(err, docs) {
      if (!err) {
        if (docs) {
          res.render("secrets", {
            secrets: docs
          });
        }
      }
    });
    // redirecting to login page for unauthenticated user
  } else {
    res.redirect("/login");
  }
});

// handling GET request to /submit route
app.get("/submit", function(req, res) {
  // rendering secrets page if user is logged in
  if (req.isAuthenticated()) {
    res.render("submit");
    // redirecting to login page for unauthenticated user
  } else {
    res.redirect("/login");
  }
});

// handling GET request to /login route
app.get("/login", function(req, res) {
  // redirecting to secrets page if user is already logged in
  if (req.isAuthenticated()) {
    openSecrets(req, res);
    // rendering login page for unauthenticated user
  } else {
    res.render("login");
  }
});

// handling GET request to /logout route
app.get("/logout", function(req, res) {
  // removing user from session
  req.logout();
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
    // redirecting to secrets page after login
    if (!err) {
      openSecrets(req, res);
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
    email: user.email,
    provider: "local"
  }, user.password, function(err, user) {
    if (err) {
      // redirecting to register page in case of error
      req.flash("register", err.message);
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
        req.flash("login", info.message);
        res.redirect("/login");
      } else {
        // signing in the new user and establishing a session
        signIn(user, req, res);
      }
    }
  })(req, res);
});

// handling POST request to /submit route
app.post("/submit", function(req, res) {
  const secret = req.body.secret;
  User.findById(req.user.id, function(err, user) {
    if (!err) {
      if (user) {
        user.secret = secret;
        user.save(function(err) {
          if (!err) {
            res.redirect("/secrets");
          }
        });
      }
    }
  });
});

// starting server on port
app.listen(PORT, function() {
  console.log("Server started on port " + PORT);
});
