"use strict";

const   Parent = require("../models/parent");
const   passport = require("passport");

var displayParent = null;

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

exports.show = (req, res, next) => {
    console.log("GET:show the parent by id:");
    let userId = req.params.id;
    Parent.findById(userId)
    .then(user => {
        res.locals.user = user;
        next();
    })
    .catch(error => {
        console.log(`Error fetching user by Id(${userId}): ${error.message}`);
        next(error);
    })
};


exports.redirectView = (req, res, next) => {
    let redirectPath = res.locals.redirect;

    if (redirectPath) {
        res.redirect(redirectPath);
    } else {
        next(); 
    }
}

exports.showView = (req, res) => {
    res.render("parent/show");
};

exports.new = (req, res) => { //Take input to create a new parent
    console.log("GET:new:");
    res.render("parent/new", {
        firstName:req.query.firstName,
        lastName:req.query.lastName,
        userEmail:req.query.userEmail
    });
};


exports.signUp = (req, res) => {
    console.log("GET:signUp:");
    res.render("parent/sign-up", {
        newParentEmail:req.query.newParentEmail,
        loginEmail:req.query.loginEmail
    });
};


authenticateThenRegister = (req, res, next) => {
    let inputEmail = req.body.register_user_email;
    Parent.findOne({email: inputEmail})
    .exec()

    .then((data)=>{
        if(data){
            req.flash("error",`${inputEmail} is registered. Try logging in with it.`);
            console.log(`ERROR: ${inputEmail} is registered. Try logging in with it.`);
            res.redirect("parent/sign-up?logInEmail=" + inputEmail);
        } else {
            console.log("parentController:emailCheck: " + inputEmail + " is new. Register user");
            res.redirect("parent/new?userEmail=" + inputEmail);
        }
    })

    .catch((error) => {
        console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
        next(error);
    })
}

isPasswordValid = (req, password) => {
    console.log("In isPasswordValid");
    var valid = true;

    var regexAlphaNumeric = /^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$/;
    if (!password.match(regexAlphaNumeric)){
        req.flash("error",`Invalid Password [${password}]: must be Alphanumeric. With at least 1 number and 1 letter.`);
        console.log("Invalid Password: must be Alphanumeric. With at least 1 number and 1 letter.");
        valid = false;
    }

    if ((password.length < 8) || (20 < password.length )){
        req.flash("error",`Invalid Password [${password}]: 8 <= Password length <= 20.`);
        console.log("Invalid Password: 8 <= Password length <= 20");
        valid = false;
    }

    return valid;
}


authenticateThenLogin = (req, res, next) =>{
    let inputEmail = req.body.logInEmail;

    Parent.findOne({email: inputEmail})
    .exec()

    .then((data)=>{
        if(!data){//User is not in database.
            console.log(`Error: ${inputEmail} is not registered`);
            req.flash("error", `${inputEmail} is not registered`);
            res.redirect("parent/sign-up?registerEmail=" + inputEmail);
        } else {
            passport.authenticate("local", {
                failureRedirect: `parent/sign-up?loginEmail=${inputEmail}`,
                failureFlash: `Incorrect password for ${data.fullName}!`,
                successRedirect: "parent/show",
                successFlash: `${data.fullName} - logged in successfully!`
            });
        }
    })

    .catch((error) => {
        console.log(`Searhing databse for ${inputEmail} gave error: ${error.message}`);
        next(error);
    })
}


exports.authenticate = (req, res, next) => {
    console.log("parentController:authenticate call back for POST:parent/sign-up");
    let callType = req.query.type;

    if(callType === "register"){
        console.log("Trying to register as new parent");
        authenticateThenRegister(req, res, next);
    } else if (callType === "login"){
        let inputEmail = req.body.logInEmail;
        let password = req.body.password;

        console.log("Login credentials: email: "+inputEmail+" Password: "+password);
        if((typeof inputEmail === 'undefined') || (inputEmail === null) || (inputEmail === "")){
            req.flash("error","Email is empty - cannot login without it");
            console.log("ERROR: Email is empty - cannot login without it");
            res.redirect("parent/sign-up");
        } else {
            if (isPasswordValid(req, password)){
                authenticateThenLogin(req, res, next);
            } else {
                console.log("Error: parentController:authenticate: password is invalid. Back to parent signup page.");
                res.redirect("parent/sign-up?logInEmail="+inputEmail);    
            }
        }
    }
};


exports.logout = (req, res, next) => {
    req.logout(); //Provided by passport js
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
}


exports.create = (req, res, next) => {
    if (req.skip) next();
    let userParams = getUserParams(req.body);

    Parent.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.redirect("parent/sign-up/?logInEmail="+userParams.email);
        } else { //email is NOT in DB. Create new parent object, save to DB and go to parent area.
            const parentTemp = new Parent(userParams);

            Parent.register(newParent, req.body.password, (error, user) => {
                if (user) {
                    req.flash("success", `${user.fullName}'s account created successfully!`);
                    res.locals.redirect = "/parent/show";
                    next();
                } else {
                    req.flash("error", `Failed to create user account because: ${error.message}.`);
                    res.locals.redirect = "/parent/new";
                    next();
                }
            });
        }
    })

    .catch((error) => {
        console.log("Error in searching for "+userParams.email+" in the database");
        console.log(error);
        next(error);
    })
}

exports.validate = (req, res, next) => {
    const emailErrorMessage = "Email is invalid";

    req
    .sanitizeBody("first")
    .trim();

    req
    .sanitizeBody("last")
    .trim();

    req
    .sanitizeBody("email")
    .normalizeEmail({
        all_lowercase: true
    })
    .trim();
    req.check("email", emailErrorMessage).isEmail();

    req.checkBody('confirmEmail', 'Confirmation email does not match email').equals(req.body.email);

    req.check("password", "Password must be alphaNumeric (at least 1 number & 1 letter) & 8 <= length <= 15.")
    .isLength({min: 8, max: 15})
    .matches(/^(?=.*[0-9])(?=.*[a-zA-Z])[0-9a-zA-Z]+$/);

    req.checkBody('confirmPassword', 'Confirmation password does not match password').equals(req.body.password);

    req.getValidationResult().then(error => {
        if (!error.isEmpty()) {
            let messages = error.array().map(e => e.msg);
            let messageString = messages.join(" and ");
            req.skip = true; //tells to skip the create action and instead go to redirectView
            req.flash("error", messageString);
            var redirectPath = "parent/sign-up?firstName=" + req.body.first + "&lastName=" + req.body.last;
            if(!messageString.includes(emailErrorMessage)){
                redirectPath = redirectPath + "&userEmail=" + req.body.email;
            }
            res.locals.redirect = redirectPath;
            next();
        } else {
            next();
        }
    });
}
    