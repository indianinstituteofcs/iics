"use strict";

const   stripe = require("stripe")("sk_test_51HTWIEDp5YY8rA5WYJLWjgL9iGTQ6bL6sCAzYBT0eQowLMfH054ASrtpLHej3Oz8aMPzx865KrpnxIlqdaPtWc1z00JJ5JGteu");
const   express = require("express");
const   app = express();
const   router = require("./routes/index");
const   https = require("https")
const   fs = require("fs")
const   layouts = require("express-ejs-layouts");
const   mongoose = require("mongoose");
const   methodOverride = require("method-override");
const   expressSession = require("express-session");
const   MongoStore = require('connect-mongo')(expressSession);
const   cookieParser = require("cookie-parser");
const   connectFlash = require("connect-flash");
const   passport = require("passport");
const   Student = require("./models/student");

mongoose.Promise = global.Promise;
mongoose.connect(
    "mongodb://localhost:27017/iics_DB", 
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }
)
.then(() => console.log("Connected to MongoDB via mongoose....."))
.catch((err) => console.log(err));

mongoose.set("useCreateIndex", true);

app.set('view engine', 'ejs');
app.set("port", process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(layouts);
app.use(express.static("public"));

app.use(methodOverride("_method", {
    methods: ["POST", "GET"]
}));
app.use(cookieParser("secret_passcode"));
const sessionStore = new MongoStore({ mongooseConnection: mongoose.connection, collection: 'allSessions' });
app.use(expressSession({
    secret:"secret_passcode",
    resave:true,
    saveUninitialized:true,
    name:"IICS_Cname_$3cr38",
    store:sessionStore,
    cookie: {
        httpOnly: true,
        secure: true,
        //sameSite: true,
        maxAge: 5*24*60*60*1000 // 5 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds - Time is in milliseconds
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

const   YOUR_DOMAIN = 'https://localhost:3000';
const   studentController = require("./controllers/studentController");

app.post('/create-session', async (req, res) => {
    console.log("main: app.post: create_session: session");
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'A College-Level Introduction to Computing Using Java',
                    },
                    unit_amount: 80000,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${YOUR_DOMAIN}/student/show?payment_status=${studentController.randomVariableJC(req, res)}`,
        cancel_url: `${YOUR_DOMAIN}/student/enroll?payment_status=0`,
    });
  
    //console.log(session);
    //console.log("Session Id: "+ session.id);
    //console.log("Student logged in: " + res.locals.currentUser.fullName);

    res.json({ id: session.id });
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

