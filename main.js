"use strict";

const   express = require("express");
const   app = express();
const   router = require("./routes/index");
const   https = require("https")
const   fs = require("fs")
const   layouts = require("express-ejs-layouts");
const   mongoose = require("mongoose");
const   methodOverride = require("method-override");
const   expressSession = require("express-session");
const   cookieParser = require("cookie-parser");
const   connectFlash = require("connect-flash");
const   passport = require("passport");
const   Student = require("./models/student");

mongoose.Promise = global.Promise;
mongoose.connect(
    "mongodb://localhost:27017/iics_DB", 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true}
    )
.then(() => console.log("Connected to MongoDB via mongoose....."))
.catch((err) => console.log(err));

mongoose.set("useCreateIndex", true);

app.set('view engine', 'ejs');
app.set("port", process.env.PORT || 3000);
app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(layouts);
app.use(express.static("public"));

app.use(methodOverride("_method", {
    methods: ["POST", "GET"]
}));
app.use(cookieParser("secret_passcode"));
app.use(expressSession({
    secret:"secret_passcode",
    resave:true,
    saveUninitialized:true,
    name:"IICS_Cname_$3cr38",
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: true,
        maxAge: 86400000 // Time is in miliseconds
    }
}));
app.use(connectFlash());

app.use(passport.initialize());
app.use(passport.session()); //Session must come before this line.
passport.use(Student.createStrategy()); 

//Student must be required before this line
passport.serializeUser(Student.serializeUser());
passport.deserializeUser(Student.deserializeUser());

app.use((req, res, next) => {
    res.locals.flashMessages = req.flash();
    res.locals.loggedIn = req.isAuthenticated();
    //console.log("Logged" + res.locals.loggedIn);
    res.locals.currentUser = req.user;
    res.locals.title = "IICS";
    next();
  });

app.use("/",router);
const port = app.get("port");

const key = fs.readFileSync("localhost-key.pem", "utf-8");
const cert = fs.readFileSync("localhost.pem", "utf-8");

https.createServer({ key, cert }, app).listen(
    port, () => {
        console.log(`Server running at https://localhost:${port}`);
    }
);

