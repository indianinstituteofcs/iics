const   mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/iics_DB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to MongoDB via mongoose....."))
.catch((err) => console.log(err));

const   db = mongoose.connection;
const   Parent = require("./models/parent");
const   express = require("express");
const   layouts = require("express-ejs-layouts");
const   homeController = require("./controllers/homeController");
const   errorController = require("./controllers/errorController");
const   parentController = require("./controllers/parentController");
const   expressSession = require("express-session");
const   cookieParser = require("cookie-parser");
const   connectFlash = require("connect-flash");
const   app = express();

mongoose.Promise = global.Promise;
app.use(express.static(__dirname + '/public'));
app.set("port", process.env.PORT || 3000);
app.set('view engine', 'ejs');
app.use(layouts);
app.use(express.urlencoded({ extended: false}));
app.use(express.json());

app.use(cookieParser("secret_passcode"));
app.use(expressSession({
    secret:"secret_passcode",
    cookie:{maxAge:4000000},
    resave:true,
    saveUninitialized:true
}));
app.use(connectFlash());

app.use((req, res, next) => {
    res.locals.messages = req.flash();       1
    next();
  });


app.get("/", homeController.sendRoot);
app.get("/about", homeController.sendAbout);
app.get("/class", homeController.sendClass);
app.get("/parent-area", parentController.sendParentArea);
app.get("/parent-account", parentController.sendParentAccount);
app.get("/parent-registration", parentController.sendParentRegistration);
app.get("/registered-parents", parentController.getAllParents);

app.post("/parent-account", parentController.emailCheck);
app.post("/parent-registration", parentController.registerParent);

app.use(errorController.logErrors);
app.use(errorController.respondInternalError);
app.use(errorController.respondNoResourceFound);
app.use(homeController.logPathRequests);
  
const port = app.get("port");
app.listen(port, () => {
    console.log(`Server running at http://localhost: ${port}`);
});

