//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
const app = express();
const port = 3000;


app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

mongoose.connect('mongodb://localhost:27017/userDB');

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

const secret = process.env.SECRET;

userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"] });

const User = new mongoose.model('User', userSchema);


app.get("/", function(req, res) {
  res.render("home");
})

app.get("/login", function(req, res) {
  res.render("login");
});

app.post("/login", function(req, res) {
    const userName = req.body.username;
    const password = req.body.password;
    User.findOne({
      email: userName
    }, function(err, result) {
      if (err) {
        console.log(err);
      } else {
        if (result) {
          if (result.password === password) {
            res.render("secrets");
          } else {
            res.send("Password is incorrect");
          }
        } else {
          res.send("User doesnt exist, try again!");
        }
      }
    })
});

app.get("/register", function(req, res) {
  res.render("register");
})

app.post("/register", function(req, res) {
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err) {
    if (err) {
      console.log(err);
    } else {
      res.render("secrets");
    }
  });

});

app.listen(port, function() {
  console.log("Server has successfully been launched on port " + port + ".");
})
