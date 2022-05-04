//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: 'A Secret',
    resave: false,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB');


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(passportLocalMongoose);

// Find or Create plugin
userSchema.plugin(findOrCreate);

// const secret = process.env.SECRET;

// userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model('User', userSchema);


passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Google OAuth Strategy

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//  ^^End Of OAuth Googe^^
app.get("/", function(req, res) {
  res.render("home");
})

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", passport.authenticate('local'), function(req, res) { //add authorization here due to login bug
  const user = new User ({
    username: req.body.username,
    password: req.body.password
  });

    req.login(user, function(err) {
      if (err) {
        return next (err);
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets");
        })
      }
    })

});

app.get("/secrets", function(req, res) {
  if (req.isAuthenticated()) {
    console.log(req.isAuthenticated());

        res.render("secrets");
  } else {
        console.log(req.isAuthenticated());
        res.redirect("/login");
  }

})

app.get("/register", function(req, res) {
  res.render("register");
})

app.get("/logout", function(req, res) {
    req.logout();
    res.redirect("/");
})

app.post("/register", function(req, res) {

    User.register({username: req.body.username, active: true}, req.body.password, function(err, user) {

          if (err) {
              console.log(err);
              console.log("phase 1");
              res.redirect("/register");
          } else {
            console.log("phase 2");
              passport.authenticate('local')(req, res, function() {
                res.redirect("/secrets");
              });

              // Failed attempt at authentication! Need To revisit later!
              // const authenticate = User.authenticate('local');
              // authenticate(req.body.username, req.body.password, function(err, result) {
              //       if (err) {
              //         console.log(err);
              //       } else {
              //         console.log("phase 3");
              //         res.redirect("/secrets");
              //       }
              // })
          }
    })


});

app.listen(port, function() {
  console.log("Server has successfully been launched on port " + port + ".");
})
