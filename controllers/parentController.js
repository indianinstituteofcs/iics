//"use strict";

const   Parent = require("../models/parent");
const   passport = require("passport");
const { check, validationResult } = require("express-validator");

const fName = "parentController:";

getUserParams = (body) => {
    let userParams = {
        name:{
            first: body.first,
            last: body.last
        },
        email: body.email,
        students:[],
        password: body.password
    }
    return userParams;
}

exports.getAllParents = (req, res, next) => {
    Parent.find({}, (error, parentList) => {
        if (error) next(error);
        res.render("registered-parents", {parentList: parentList});
    });
};


exports.redirectView = (req, res, next) => {
    let redirectPath = res.locals.redirect;
    console.log(fName + "redirectView to: "+ redirectPath);

    if (redirectPath) {
        res.redirect(redirectPath);
    } else {
        next(); 
    }
}

exports.showView = (req, res) => {
    console.log(fName + "showView: user: "+req.user);
    res.render("parent/show");
};

exports.new = (req, res) => { //Take input to create a new parent
    console.log(fName +"new: req.query:");
    console.log(req.query);

    res.render("parent/new", {
        firstName:req.query.firstName,
        lastName:req.query.lastName,
        userEmail:req.query.userEmail
    });
};


exports.signUp = (req, res) => {
    console.log(fName+ "signUp:");
    res.render("parent/signup", {
        newParentEmail:req.query.newParentEmail,
        email:req.query.loginEmail
    });
};


//JC TO DO WHY?!?!passport has to be called like this - stand alone. Moment it is in a function it hangs!!!
authenticateThenLogin =
    passport.authenticate("local", {
        failureRedirect: `/parent/signup`,
        failureFlash: true,
        successRedirect: `/parent/show/`,
        successFlash: `Logged In!`
    });


exports.validationChainLogIn = [
    check("email", "Invalid email").normalizeEmail().trim().isEmail(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("password", "Password missing 1 number").matches(/\d{1}/),
    check("password", "Password missing 1 letter").matches(/[A-Z]{1}/i)
];

exports.validateLogIn = (req, res, next) => {
    error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating login information: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/parent/signup";
        if(!messageString.includes("Invalid email")){
            redirectPath = redirectPath + "&email=" + req.body.email;
        }
        res.redirect(redirectPath);
    } else {
        console.log("SUCCESS: email ("+ req.query.email +") and password ("+ req.query.password +")are valid");
        authenticateThenLogin(req, res, next);
    }
}


exports.validationChainEmailCheck = [
    check("newParentEmail", "Invalid email").normalizeEmail().trim().isEmail()
];


exports.validateEmailCheck = (req, res, next) => {
    error = validationResult(req);
    if (!error.isEmpty()) {
        let messageString = error.array().map(e => e.msg);
        console.log("ERROR: validating email for new Parent: " + messageString);
        req.flash("error", messageString);
        res.locals.redirect = "/parent/signup";
        next();
    } else {
        console.log("SUCCESS: email for new Parent is valid");
        let inputEmail = req.body.newParentEmail;
        Parent.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(data){
                req.flash("error",`${inputEmail} is registered. Try logging in with it.`);
                console.log(`ERROR: ${inputEmail} is registered. Try logging in with it.`);
                res.locals.redirect = "/parent/signup?email=" + inputEmail;
            } else {
                console.log(inputEmail + " is new. Register user");
                res.locals.redirect = "/parent/new?userEmail=" + inputEmail;
            }
            next();
        })
    
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }
}


exports.logout = (req, res, next) => {
    req.logout(); //Provided by passport js
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
}


const emailErrorMessage = "Invalid email";


exports.validationChain = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().isEmail(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("password", "Password missing 1 number").matches(/\d{1}/),
    check("password", "Password missing 1 letter").matches(/[A-Z]{1}/i),
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
];


exports.validate = (req, res, next) => {
    error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating registration form: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/parent/new?firstName=" + req.body.first + "&lastName=" + req.body.last;
        if(!messageString.includes(emailErrorMessage)){
            redirectPath = redirectPath + "&userEmail=" + req.body.email;
        }
        res.locals.redirect = redirectPath;
        next();
    } else {
        console.log("SUCCESS: all registration form input are valid");
        create(req,res,next);
    }
}

create = (req, res, next) => {
    console.log("parentController:create");
    //if (req.skip) next();
    let userParams = getUserParams(req.body);

    Parent.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.locals.redirect = `parent/signup/?loginEmail=${userParams.email}`;
            return next();
        } else { //email is NOT in DB. Create new parent object, save to DB and go to parent area.
            console.log("User ("+userParams.email+") is not in DB. Will try to add it.");
            const newParent = new Parent(userParams);

            Parent.register(newParent, req.body.password, (error, user) => {
                if (user) {
                    req.flash("success", `${user.fullName}'s account created successfully!`);
                    req.login(user, function(err) {
                        if (err) { 
                            console.log("ERROR: " + user.fullName + "registered but could not log in");
                            return next(err); 
                        }
                        res.locals.currentUser = user;
                      });
                    res.locals.redirect = "/parent/show";
                } else {
                    req.flash("error", `Failed to create user account because: ${error.message}.`);
                    res.locals.redirect = "/parent/new";
                }
                return next();
            });
        }
    })

    .catch((error) => {
        console.log("Error in searching for "+userParams.email+" in the database");
        console.log(error);
        next(error);
    })
}

    