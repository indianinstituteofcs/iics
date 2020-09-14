const   express = require("express");
const   app = express();
const   layouts = require("express-ejs-layouts");
const   mongoose = require("mongoose");
const   homeController = require("./controllers/homeController");
const   errorController = require("./controllers/errorController");
const   parentController = require("./controllers/parentController");
const   router = express.Router();
const   methodOverride = require("method-override");
const   expressSession = require("express-session");
const   cookieParser = require("cookie-parser");
const   connectFlash = require("connect-flash");
const   expressValidator = require("express-validator");
const   passport = require("passport");
const   Parent = require("./models/parent");

mongoose.connect(
    "mongodb://localhost:27017/iics_DB", 
    {useNewUrlParser: true,
        useUnifiedTopology: true}
    )
.then(() => console.log("Connected to MongoDB via mongoose....."))
.catch((err) => console.log(err));


app.set('view engine', 'ejs');
app.set("port", process.env.PORT || 3000);
app.use(express.urlencoded({ extended: false}));
app.use(express.json());
app.use(layouts);
app.use(express.static("public"));

router.use(methodOverride("_method", {
    methods: ["POST", "GET"]
}));
router.use(cookieParser("secret_passcode"));
router.use(expressSession({
    secret:"secret_passcode",
    cookie:{maxAge:4000000},
    resave:true,
    saveUninitialized:true
}));
router.use(connectFlash());
router.use(expressValidator()); //Must come after json and urlencoded uses.

router.use(passport.initialize());
router.use(passport.session()); //Session must come before this line.
passport.use(Parent.createStrategy()); //Parent must be required before this line
passport.serializeUser(Parent.serializeUser());
passport.deserializeUser(Parent.deserializeUser());

router.use((req, res, next) => {
    res.locals.flashMessages = req.flash();
    res.locals.loggedIn = req.isAuthenticated();
    console.log("Logged" + res.locals.loggedIn);
    res.locals.currentUser = req.user;
    next();
  });


router.get("/", homeController.getRoot);
router.get("/about", homeController.getAbout);
router.get("/class", homeController.getClass);
router.get("/parent/:id", parentController.show, parentController.showView);
router.get("/parent/new", parentController.new);
router.get("/parent/signup", parentController.signUp);
router.post("/parent/sign-up", parentController.authenticate);
router.get("/parent/logout", parentController.logout, parentController.redirectView);
router.post("/parent/create", parentController.validate, parentController.create, parentController.redirectView);

router.get("/registered-parents", parentController.getAllParents);



router.use(errorController.logErrors);
router.use(errorController.respondInternalError);
router.use(errorController.respondNoResourceFound);

app.use("/",router);
const port = app.get("port");
app.listen(port, () => {
    console.log(`Server running at http://localhost: ${port}`);
});

