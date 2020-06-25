// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}
// exporting object containing configuration options
module.exports = {
  // URL for mongoose connection
  URL: "mongodb://localhost:27017/usersDB",
  // options for mongoose connection
  mongooseConnectionOptions: {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true
  },
  // options for configuring passport-local-mongoose plugin
  passportLocalMongooseOptions: {
    usernameField: "email",
    errorMessages: {
      IncorrectPasswordError: 'Password is incorrect!',
      IncorrectUsernameError: 'Email does not exist!',
      UserExistsError: "Email already exists!"
    }
  },
  // options for configuring google oAuth strategy
  googleOptions: {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/sneakybeaky",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  // options for configuring facebook oAuth strategy
  facebookOptions: {
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/sneakybeaky",
    profileFields: ["emails", "displayName"]
  },
  // options for configuring github oAuth strategy
  githubOptions: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/github/sneakybeaky"
  },
  // scope parameters for google oAuth
  googleScope: {
    scope: ["profile", "email"]
  },
  // scope parameters for github oAuth
  githubScope: {
    scope: ["user:email"]
  },
  // cookie name
  cookieName: process.env.COOKIE_NAME,
  // cookie secret
  cookieSecret: process.env.COOKIE_SECRET
};
