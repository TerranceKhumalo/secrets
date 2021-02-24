"use strict";
const express = require("express");
const app = express();
const ejs = require("ejs");
const mongoose = require("mongoose");
const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect("mongodb://localhost/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
const UserSchema = mongoose.Schema({
    username: {type: String, required: true},
    password: {type: String, required: true}
});

const User = mongoose.model("User", UserSchema);


app.get("/", (req,res)=>{
    res.render("home");
});

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/register", (req,res)=>{
    res.render("register");
});

app.post("/register", (req, res)=>{
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    user.save((err)=>{
        if(err)console.error(err);
        else {
            console.log("Save user was successful");
            res.render("secrets")
        };
    });
});

app.post("/login", (req, res)=>{
    const username = req.body.username;
    const password = req.body.password
    User.findOne({username}, (err, foundDoc)=>{
        if(err)console.error(err);
        else {
            if(foundDoc){
                if(foundDoc.password === password){
                    res.render("secrets");
                }else res.send("Sorry wrong email or password");
            }
        }
    });
});






app.listen(port, ()=>{
    console.log(`Secrets app is llistining at http:/localhost:${port}`);
});