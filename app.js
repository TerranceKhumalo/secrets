"use strict";

require("dotenv").config();
const express = require("express");
const app = express();
const session = require("express-session");
const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const port = 3000;

app.use(express.static("public"));
app.use(express.urlencoded({
    extended: true
}));
app.set("view engine", "ejs");
app.use(session({
    secret: "Is it me your looking for I can see it in your eyes!",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost/userDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const UserSchema = mongoose.Schema({
    username: {
        type: String,
    },
    password: {
        type: String,
    },
    googleId: String,
    facebookeId: String,
    secretMsg: String
});
//Plugin that make's it simple to hash password
UserSchema.plugin(passportLocalMongoose);
UserSchema.plugin(findOrCreate);
const User = new mongoose.model("User", UserSchema);

passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
//SETTING GOOGLE OAUTH
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets"
    },
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));
//FACEBOOK OAUTH
passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: "http://localhost:3000/auth/facebook/secrets"
    },
    function (accessToken, refreshToken, profile, done) {
        User.findOrCreate({
            facebookeId: profile.id
        }, function (err, user) {
            if (err) {
                return done(err);
            }
            done(null, user);
        });
    }
));

app.get("/", (req, res) => {
    res.render("home");
});
//Google authentication
app.get('/auth/google',
    passport.authenticate('google', {
        scope: ["profile"]
    }));

app.get('/auth/google/secrets',
    passport.authenticate('google', {
        failureRedirect: '/login'
    }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
    }));

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        User.find({"secretMsg": {$ne: null}}, (err, foundDoc)=>{
            if(err)console.error(err);
            else{
                res.render("secrets", {secretMsg: foundDoc});
            }
        });
        
    } else {
        res.render("login");
    }
});

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.render("login");
    }
});

app.post("/submit", (req, res) => {
    console.log(req.body.secret);
    User.findById(req.user._id, (err, foundUser) => {
        if (err) console.error(err);
        else {
            foundUser.secretMsg = req.body.secret;
            foundUser.save();
            console.log("Update was successful!", foundUser);
            res.redirect("/secrets");
        }
    });

});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.post("/register", (req, res) => {

    User.register({
        username: req.body.username
    }, req.body.password, (err, user) => {
        if (err) console.error(err);
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) console.error(err);
        else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("secrets");
            });
        }
    });
});






app.listen(port, () => {
    console.log(`Secrets app is listining at http:/localhost:${port}`);
});