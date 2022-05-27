require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");

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
    password : String
});

userSchema.plugin(passportlocalmongoose);

const User = new mongoose.model("user",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
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


