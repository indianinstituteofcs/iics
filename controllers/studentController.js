"use strict";

const   Student = require("../models/student");
const   passport = require("passport");
const { check, validationResult } = require("express-validator");
const { session } = require("passport");
const { findByIdAndRemove } = require("../models/student");

const fName = "studentController:";

function getUserParams(body){
    let userParams = {
        name:{
            first: body.first,
            last: body.last
        },
        email: body.email,
        enrolled:body.enrolled,
        password: body.password
    }
    return userParams;
}


function makeRandomString(stringLength){
    var rV =  '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < stringLength; i++ ) {
        rV += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    console.log(fName + "makeRandomString: " + rV);
    return rV;
}

//Create rV - random alphanumeric case sensitive string of length 64.
//Store rV as paytoken for current user, also rV is the return value of the function
exports.randomVariableJC = (req, res) => {
    console.log(fName + "randomVariableJC");

    var rV =  makeRandomString(64);

    //This only gets called when a user is logged in.
    if(res.locals.loggedIn){
        let userParams = {paytoken: rV};
        Student.findByIdAndUpdate(res.locals.currentUser._id, {$set: userParams},{new:true})
        .exec()

        .then((user) => {
            console.log(`SUCCESS: ${user.fullName} payToken has been updated`);
            console.log(user);
            req.user = user;
            res.locals.currentUser = user;
        })

        .catch((error) => {
            console.log(`Error updating user (${res.locals.currentUser.fullName}): ${error.message}`);
        })
    } else {
        console.log(`Error: says no one is logged in!`);
    }

    return rV;
}


exports.getAllStudents = (req, res, next) => {
    Student.find({}, (error, studentList) => {
        if (error) next(error);
        res.render("registered-students", {
            studentList: studentList,
            title:"IICS:All Students"
        });
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

//return: inputToken === currentUser.paytoken and after that unset payToken.
function matchPaymentToken(req, res){
    var rV = false;
    let inputToken = req.query.payment_status;

    if(res.locals.loggedIn){//return false when no one is logged.
        let currentUser = res.locals.currentUser;
        rV = (inputToken === currentUser.paytoken);

        Student.findByIdAndUpdate(currentUser._id, {$unset: {paytoken: ""}}, {new:true})
        .exec()
        
        .then((user) => {
            console.log(`SUCCESS: ${user.fullName} removed paytoken field`);
            console.log(user);
            req.user = user;
            res.locals.currentUser = user;
        })
    
        .catch((error) => { //Can live with this. No need to crash.
            console.log(`Error in removing paytoken field for (${currentUser.fullName}): ${error.message}`);
        })        
    }

    return rV;
}


exports.showView = (req, res) => {
    console.log(fName + "showView:");
    console.log("Student Logged In: "+ res.locals.loggedIn); 
    console.log("Student Info: ");
    console.log(res.locals.currentUser);            
    var titleString = "IICS:Not Logged";
    if(res.locals.loggedIn){             
        titleString = "IICS:"+req.user.fullName;
    }

    if (typeof req.query.payment_status !== "undefined"){
        //user has made payment to enroll for the course.
        let updateEnrolled = matchPaymentToken(req, res);
        if(updateEnrolled){    
            Student.findByIdAndUpdate(res.locals.currentUser._id, {$set: {enrolled:true}}, {new:true})
            .exec()
        
            .then((user) => {
                console.log(`SUCCESS: ${user.fullName} has been enrolled in class`);
                console.log(user);
                req.user = user;
                res.locals.currentUser = user;
                res.render("student/show", {title:titleString});
            })
        
            .catch((error) => { //JC TO DO - THIS HAS TO BE ERROR
                console.log(`Error updating user (${res.locals.currentUser.fullName}): ${error.message}`);
                res.render("student/show", {title:titleString});
            })        
        } else {
            res.render("student/show", {title:titleString});
        }
    } else {
        res.render("student/show", {title:titleString});
    }
};


exports.editInfo = (req, res) => {
    console.log(fName + "editInfo:");
    console.log("Student Logged In: "+ res.locals.loggedIn); 
    console.log("Student Info: ");
    console.log(req.user);            
    var titleString = "IICS:Not Logged";
    if(req.user){             
        titleString = "IICS:Edit Info";
    }
    res.render("student/edit-info", {title:titleString});
};


exports.editPassword = (req, res) => {
    console.log(fName + "editPassword:");
    console.log("Student Logged In: "+ res.locals.loggedIn); 
    console.log("Student Info: ");
    console.log(req.user);            
    var titleString = "IICS:Not Logged";
    if(req.user){             
        titleString = "IICS:Edit Password";
    }
    res.render("student/edit-password", {title:titleString});
};


exports.enroll = (req, res) => {
    console.log(fName + "enroll:");
    console.log("Student Logged In: "+ req.isAuthenticated()); 
    console.log("Student Info: ");
    console.log(req.user);            
    var titleString = "IICS:Not Logged";
    if(req.user){             
        titleString = "IICS:Enroll";
    }
    res.render("student/enroll", {title:titleString});
};

exports.new = (req, res) => { //Take input to create a new student
    console.log(fName +"new: req.query:");
    console.log(req.query);

    res.render("student/new", {
        title:"IICS:New",
        firstName:req.query.firstName,
        lastName:req.query.lastName,
        userEmail:req.query.userEmail
    });
};


exports.signUp = (req, res) => {
    console.log(fName+ "signUp:");
    res.render("student/signup", {
        title:"IICS:Sign In",
        registerEmail:req.query.registerEmail,
        loginEmail:req.query.loginEmail
    });
};


//JC TO DO WHY?!?!passport has to be called like this - stand alone. Moment it is in a function it hangs!!!
const authenticateThenLogin =
    passport.authenticate("local", {
        failureRedirect: `/student/signup`,
        failureFlash: true,
        successRedirect: `/student/show/`,
        successFlash: `Logged In!`
    });


/* No reason to check if password matches regex.
 User is supposed to give right password to logIn.
 If password is incorrect - login will fail.*/
exports.validationChainLogIn = [
    check("email", "Invalid email").normalizeEmail().trim().escape().isEmail(),
    check("password").trim().escape()
];


exports.validateLogIn = (req, res, next) => {
    console.log(fName+"validateLogIn");
    console.log("SessionId: "+session.id);
    console.log("SessionId: "+session);
    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating login information: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/student/signup";
        if(!messageString.includes("Invalid email")){
            redirectPath = redirectPath + "?loginEmail=" + req.body.email;
        }
        res.redirect(redirectPath);
    } else {
        console.log("SUCCESS: email ("+ req.body.email +") and password ("+ req.body.password +")are valid");

        let inputEmail = req.body.email;
        Student.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(!data){//student is not in DB. Cannot login. Register the new student.
                req.flash("error",`${inputEmail} is new. Register user.`);
                console.log(`ERROR: ${inputEmail} is new. Register user.`);
                res.redirect("/student/signup?registerEmail=" + inputEmail);
            } else {//student is in DB. Go ahead and log in. 
                console.log(inputEmail + " is in DB. Proceeding to authenticate.");
                authenticateThenLogin(req, res, next);
            }
        })
    
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }
}


exports.validationChainEmailCheck = [
    check("newStudentEmail", "Invalid Email").trim().normalizeEmail().escape().isEmail()
];


exports.validateEmailCheck = (req, res, next) => {
    console.log(fName + "validateEmailCheck:");
    console.log( req.body);

    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messageString = error.array().map(e => e.msg);
        console.log("ERROR: validating email for new Student: " + messageString);
        req.flash("error", messageString);
        res.locals.redirect = "/student/signup";
        next();
    } else {
        console.log("SUCCESS: email for new Student is valid");
        let inputEmail = req.body.newStudentEmail;
        Student.findOne({email: inputEmail})
        .exec()
    
        .then((data)=>{
            if(data){
                req.flash("error",`${inputEmail} is registered. Try logging in with it.`);
                console.log(`ERROR: ${inputEmail} is registered. Try logging in with it.`);
                res.locals.redirect = "/student/signup?loginEmail=" + inputEmail;
            } else {
                console.log(inputEmail + " is new. Register user");
                res.locals.redirect = "/student/new?userEmail=" + inputEmail;
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
    console.log(fName + "logout:");
    console.log("Student Logged In: "+ res.locals.loggedIn);
    console.log("Student Info: ");
    console.log(req.user);
    req.logout(); //Provided by passport js
    console.log("*********** AFTER LOGOUT *************");   
    console.log("Student Logged In: "+ res.locals.loggedIn); 
    console.log("Student Info: ");
    console.log(req.user);
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
}


const emailErrorMessage = "Invalid email";

exports.validationChain = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
    check("password").trim().escape(),
    check("password", "8 <= password length <= 15.").isLength({min:8, max:15}),
    check("password", "Password is not alphanumeric").isAlphanumeric(),
    check("password", "Password must have at least 1 number").matches(/\d{1}/),
    check("password", "Password must have at least 1 letter").matches(/[A-Z]{1}/i),
    check('confirmPassword', 'Passwords do not match').custom((value, {req}) => (value === req.body.password))
];


exports.validate = (req, res, next) => {
    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating registration form: " + messageString);
        req.flash("error", messageString);
        var redirectPath = "/student/new?firstName=" + req.body.first + "&lastName=" + req.body.last;
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

function create(req, res, next){
    console.log(fName + "create");
    //if (req.skip) next();
    let userParams = getUserParams(req.body);
    userParams.enrolled = false;

    Student.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.locals.redirect = `/student/signup/?loginEmail=${userParams.email}`;
            return next();
        } else { //email is NOT in DB. Create new student object, save to DB and go to student area.
            console.log("User ("+userParams.email+") is not in DB. Will try to add it.");
            const newStudent = new Student(userParams);

            Student.register(newStudent, req.body.password, (error, user) => {
                if (user) {
                    console.log(`SUCCESS: ${user.fullName}'s account created successfully!`);
                    req.flash("success", `${user.fullName}'s account created successfully!`);
                    req.login(user, function(err) {
                        if (err) { 
                            console.log("ERROR: " + user.fullName + "registered but could not log in");
                            return next(err); 
                        }
                        req.user = user;
                        res.locals.currentUser = user;
                      });
                    console.log(req.sessions);
                    res.locals.redirect = "/student/show";
                } else {
                    req.flash("error", `Failed to create user account because: ${error.message}.`);
                    res.locals.redirect = "/student/new";
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


exports.validationChainUpdateInfo = [
    check("first").trim().escape(),
    check("last").trim().escape(),
    check("email", emailErrorMessage).normalizeEmail().trim().escape().isEmail(),
];


const authenticateInfoForNewEmail =
    passport.authenticate("local", {
        failureRedirect: `/student/edit-info`,
        failureFlash: true,
        successRedirect: `/student/show`
    });


exports.validateUpdateInfo = (req, res, next) => {
    let inputEmail = req.body.email;
    if(inputEmail !== res.locals.currentUser.email){
        Student.findOne({email: inputEmail})
        .exec()
        
        .then((user)=>{
            if(user){//new email is in DB. Cannot update.
                req.flash("error",`Update aborted: ${inputEmail} is already in use. Try another email.`);
                console.log(`ERROR: Update aborted: ${inputEmail} is already in use. Try another email.`);
                res.redirect("/student/edit-info");
            } 
        })
        
        .catch((error) => {
            console.log(`Error fetching user by email(${inputEmail}): ${error.message}`);
            next(error);
        })    
    }

    let userParams = {
        name:{
            first: req.body.first,
            last: req.body.last
        },
        email: req.body.email,
    }

    Student.findByIdAndUpdate(res.locals.currentUser._id, {$set: userParams},{new:true})
    .exec()

    .then((user) => {
        if(user){
            req.flash("success",`Updated successfully for ${inputEmail}`);
            console.log(`SUCCESS: Updated successfully for ${inputEmail}`);
            console.log(user);
            if(inputEmail !== res.locals.currentUser.email){
                console.log("Email has been updated");
                authenticateInfoForNewEmail(req, res, next);
                console.log(req.user);
                res.locals.currentUser = req.user;
            } else {             
                req.user = user;
                res.locals.currentUser = user;
                res.redirect("/student/show");                
            }
        } else {
            req.flash("error",`Update failed for ${inputEmail}`);
            console.log(`ERROR: Update failed for ${inputEmail}`);
            res.redirect("/student/edit-info");
        }
    })

    .catch((error) => {
        console.log(`Error updating user (${res.locals.currentUser.fullName}): ${error.message}`);
        next(error);
    })
};


exports.validationChainUpdatePassword = [
    check("password").trim().escape(),
    check("newPassword").trim().escape(),
    check("newPassword", "8 <= new password length <= 15.").isLength({min:8, max:15}),
    check("newPassword", "New password is not alphanumeric").isAlphanumeric(),
    check("newPassword", "New password must have at least 1 number").matches(/\d{1}/),
    check("newPassword", "New password must have at least 1 letter").matches(/[A-Z]{1}/i),
    check("confirmNewPassword").trim().escape(),
    check('confirmNewPassword', 'New passwords do not match').custom((value, {req}) => (value === req.body.newPassword))
];


const authenticateForNewPassword =
    passport.authenticate("local", {
        failureRedirect: `/student/edit-password`,
        failureFlash: true,
        successRedirect: `/student/show`
    });


exports.validateUpdatePassword = (req, res, next) => {
    console.log(fName+"validateUpdatePassword");

    let error = validationResult(req);
    if (!error.isEmpty()) {
        let messages = error.array().map(e => e.msg);
        let messageString = messages.join(" and ");
        console.log("ERROR: validating update password request: " + messageString);
        req.flash("error", messageString);
        res.redirect("/student/edit-password");
    } else {
        console.log("SUCCESS: update password request is valid");
        let inputEmail = res.locals.currentUser.email;
        let currentStudent = res.locals.currentUser;
        currentStudent.changePassword(req.body.password, req.body.newPassword, function(error){
            if(error){
                req.flash("error",`Could not change password for ${inputEmail}`);
                console.log(`ERROR: Could not change password for ${inputEmail}`);
                res.redirect("/student/edit-password");
            } else {
                req.flash("success",`Updated password for ${inputEmail}`);
                console.log(`SUCCESS: Updated password for ${inputEmail}`);
                res.redirect("/student/show");
            }
        });    
    }
};

    