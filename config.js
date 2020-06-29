// setting local development state to true (false for deployment)
const LOCAL_DEV = false;
let connectionString = "";
let redirectURI = "";

// managing environment variables for production and development cases
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({
    silent: true
  });
}

// using local mongodb database or mongodb atlas depending on development state
if (LOCAL_DEV) {
  // storing local mongodb connection url
  connectionString = "mongodb://localhost:27017/secretsDB";
  redirectURI = "http://localhost:3000";
} else {
  // storing mongodb atlas database connection string
  connectionString = "mongodb+srv://" + process.env.MONGODB_ATLAS_USERNAME + ":" + process.env.MONGODB_ATLAS_PASSWORD + "@dev-test-cluster-i5jeu.mongodb.net/secretsDB?retryWrites=true&w=majority";
  redirectURI = "https://sneaky-beaky.herokuapp.com";
}

// exporting object containing configuration options
module.exports = {
  // URL for mongoose connection
  URL: connectionString,
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
    callbackURL: redirectURI + "/auth/google/sneakybeaky",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  // options for configuring github oAuth strategy
  githubOptions: {
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://sneaky-beaky.herokuapp.com/auth/github/sneakybeaky"
  },
  // options for configuring linkedin oAuth strategy
  linkedinOptions: {
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: redirectURI + "/auth/linkedin/sneakybeaky",
    state: true
  },
  // scope parameters for google oAuth
  googleScope: {
    scope: ["profile", "email"]
  },
  // scope parameters for github oAuth
  githubScope: {
    scope: ["user:email"]
  },
  // scope parameters for linkedin oAuth
  linkedinScope: {
    scope: ['r_emailaddress', 'r_liteprofile']
  },
  // cookie name
  cookieName: process.env.COOKIE_NAME,
  // cookie secret
  cookieSecret: process.env.COOKIE_SECRET
};
