require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findorcreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

app.use(session({
    secret : "Our little secret.",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    googleId : String,
    secret : String
});

userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findorcreate);

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:4000/auth/google/secrets",
    userProfileURL :  "https://googleapis.com/oauth2/v3/userinfo",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate('google',{scope:["profile"]})
);

app.get( '/auth/google/secrets',
    passport.authenticate( 'google', {
        successRedirect: "/secrets",
        failureRedirect: "/login"
}));

app.get("/submit",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req, res){
    const submittedSecret = req.body.secret;
  
  //Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user.id);
  
    User.findById(req.user.id, function(err, foundUser){
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          foundUser.secret = submittedSecret;
          foundUser.save(function(){
            res.redirect("/secrets");
          });
        }
      }
    });
  });

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret": {$ne: null}}, function(err, foundUsers){
        if (err){
          console.log(err);
        } else {
          if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
          }
        }
      });
});

app.get("/logout",function(req,res){
    req.logOut(function(err){
        if(err){
            console.log(err);
            res.redirect("/secrets");
        }else{
            res.redirect("/");
        }
    });
    
});

app.post("/register",function(req,res){
    User.register({username : req.body.username},req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post("/login",function(req,res){
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user , function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});



app.listen(4000,function(){
    console.log("Server has been started ");
});


