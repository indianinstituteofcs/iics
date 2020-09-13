const Parent = require("../models/parent");
var displayParent = null;


exports.getAllParents = (req, res, next) => {
    Parent.find({}, (error, parentList) => {
        if (error) next(error);
        res.render("registered-parents", {parentList: parentList});
    });
};


exports.sendParentArea = (req, res) => {
    console.log("GET:parent-area:");
    //console.log(res.locals.messages); //messes up single read
    res.render("parent-area",{currentParent:displayParent});
};


exports.sendParentAccount = (req, res) => {
    console.log("GET:parent-account:");
    //console.log(res.locals.messages); //messes up single read
    res.render("parent-account", {
        registerEmail:req.query.registerEmail,
        loginEmail:req.query.loginEmail
    });
};


exports.sendParentRegistration = (req, res) => {
    console.log("GET:parent-registration:");
    console.log(req.query);
    //console.log(res.locals.messages); //messes up single read
    res.render("parent-registration", {
        firstName:req.query.firstName,
        lastName:req.query.lastName,
        registerEmail:req.query.registerEmail
    });
};

emailCheckRegister = (req, res, next) => {
    let inputEmail = req.body.register_user_email;
    Parent.findOne({email: inputEmail})
    .exec()

    .then((data)=>{
        if(data){
            req.flash("error",`${inputEmail} is registered. Try logging in with the id.`);
            console.log("parentController:emailCheck: " + inputEmail + " is already in database");
            res.redirect("parent-account?loginEmail=" + inputEmail);
        } else {
            console.log("parentController:emailCheck: " + inputEmail + " is new. Register user");
            res.redirect("parent-registration?registerEmail=" + inputEmail);
        }
    })

    .catch((error) => {
        console.log(error);
        next(error);
    })
}

isPasswordValid = (req, password) => {
    console.log("In isPasswordValie");
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


emailCheckLogin = (req, res, next) =>{
    let inputEmail = req.body.login_user_email;
    let parentPassword = req.body.user_password;
    
    Parent.findOne({email: inputEmail})
    .exec()

    .then((data)=>{
        if(!data){//User is not in database. JC NEXT STEP: HOW TO NOTIFY USR OF THIS?
            console.log(`Error: ${inputEmail} is not registered`);
            req.flash("error", `${inputEmail} is not registered`);
            res.redirect("parent-account?registerEmail=" + inputEmail);
        } else {
            if (data.password.normalize()  === parentPassword.normalize()){
                displayParent = data; //displayParent is a global variable in this file.
                console.log(displayParent);
                console.log(`Success: ${data.fullName}'s found from database`);
                req.flash("success", `${data.fullName}'s found from database`);
                res.redirect("parent-area");
            } else { //Found user but password did not match
                console.log(`Error: Incorrect password for ${data.fullName}!`);
                req.flash("error", `Incorrect password for ${data.fullName}`);
                res.redirect("parent-account?loginEmail="+inputEmail);  
            }
        }
    })

    .catch((error) => {
        console.log(error);
        next(error);
    })
}


exports.emailCheck = (req, res, next) => {
    console.log("parentController:emailCheck call back for POST:parent-account");
    let callType = req.query.type;

    if(callType === "register"){
        emailCheckRegister(req, res, next);
    } else if (callType === "login"){
        var errorMessages = [];

        let inputEmail = req.body.login_user_email;
        let password = req.body.user_password;

        console.log("email: "+inputEmail+" Password: "+password);
        if((typeof inputEmail === 'undefined') || (inputEmail === null) || (inputEmail === "")){
            req.flash("error","Email is empty in Login section - cannot login without it");
            console.log("Error: Email is empty in Login section - cannot login without it");
            res.redirect("parent-account");
        } else {
            if (isPasswordValid(req, password)){
                emailCheckLogin(req, res, next);
            } else {
                console.log("Error: parentController:emailCheck: password is invalid. Back to parent signup page.");
                res.redirect("parent-account?loginEmail="+inputEmail);    
            }
        }
    }
};

getUserParams = (req) => {
    let userParams = {
        name:{
            first: req.body.first_name,
            last: req.body.last_name
        },
        email: req.body.user_email,
        students:[],
        password: req.body.user_password
    }
    return userParams;
}

registerParentDB = (req, res, next) => {
    let userParams = getUserParams(req);
    Parent.findOne({email: userParams.email})
    .exec()

    .then((data)=>{
        if(data){//email is in DB. Send it to login screen with message
            req.flash("error", `${userParams.email} is already registered`);
            console.log("ERROR: " + userParams.email + " is already registered");
            res.redirect("parent-account?loginEmail="+userParams.email);
        } else { //email is NOT in DB. Create new parent object, save to DB and go to parent area.
            const parentTemp = new Parent(userParams);

            parentTemp.save()
            .then((savedDocument)=>{
                req.flash("success", `${parentTemp.fullName}'s account created successfully!`);
                console.log("SUCCESS: " + parentTemp.fullName + "'s account created successfully!");
                displayParent = parentTemp; //displayParent is a global variable in this file.
                res.redirect("parent-area");    
            })

            .catch((error) => {
                console.log("Error in saving object for "+userParams.email+" in the database");
                console.log(error);
                next(error);
            })
        }
    })

    .catch((error) => {
        console.log("Error in searching for "+userParams.email+" in the database");
        console.log(error);
        next(error);
    })
}


exports.registerParent = (req, res, next) => {
    console.log("POST:parent-registration:to register in database");
    console.log(req.body);

    let firstName = req.body.first_name;
    let lastName = req.body.last_name;
    let registerEmail = req.body.user_email;
    let confirmRegisterEmail = req.body.confirm_user_email;
    let userPassword = req.body.user_password;
    let confirmUserPassword = req.body.confirm_user_password;
    var hasErrors = false;

    if(registerEmail.normalize() !== confirmRegisterEmail.normalize()){
        req.flash("error",`Email (${registerEmail}) does not match Email Confirmation (${confirmRegisterEmail})`);
        console.log("ERROR: Email: "+registerEmail+" Does not match Email(confirm): "+confirmRegisterEmail);
        hasErrors = true;
    }

    const passwordValidFlag = isPasswordValid(req, userPassword);
    hasErrors = hasErrors || !passwordValidFlag;

    if(userPassword.normalize() !==  confirmUserPassword.normalize()){
        req.flash("error",`Password (${userPassword}) does not match Password Confirmation (${confirmUserPassword})`);
        console.log("ERROR: Password: "+userPassword+" Does not match Password(confirm): "+confirmUserPassword);
        hasErrors = true;
    }

    if(hasErrors){
        console.log("Errors discovered. Going back to Registration form for "+ firstName);
        //console.log(req.flash().error); //messes up single read
        res.redirect("parent-registration?firstName="+firstName+"&lastName="+lastName+"&registerEmail="+registerEmail);
    } else {
        registerParentDB(req,res, next,);
    }
};
    