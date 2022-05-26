require('dotenv').config();
const mongoose = require("mongoose");
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email : String,
    password : String
});

console.log(process.env.API_KEY);

userSchema.plugin(encrypt,{secret : process.env.SECRET , encryptedFields : ["password"]});

const User = new mongoose.model("user",userSchema);

const app = express();
app.use(express.static("public"));
app.set('view engine' , 'ejs');
app.use(bodyParser.urlencoded({
    extended : true
}));

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});


app.post("/register",function(req,res){
    const newUser = new User({
        email : req.body.username,
        password : req.body.password
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        }
        else
        {
            res.render("login");
        }
    });
});

app.post("/login",function(req,res){
    const Username = req.body.username;
    const Password = req.body.password;
    User.findOne({email : Username},function(err,findresults){
        if(err)
        {
            console.log(err);
        }
        else{
            if(findresults){
                if(findresults.password === Password)
                {
                    res.render("secrets");
                }
            }
        }
    })
})



app.listen(3000,function(){
    console.log("Server has been started ");
});


