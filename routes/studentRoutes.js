"use strict";

const   router = require("express").Router();
const   studentController = require("../controllers/studentController");

//All routes start with /student 
router.get("/show", studentController.showView);

router.get("/new", studentController.new);
router.post("/create",studentController.validationChain, studentController.validate, studentController.redirectView);

router.get("/edit-info", studentController.editInfo);
router.post("/update-info", studentController.validationChainUpdateInfo, studentController.validateUpdateInfo);

router.get("/edit-password", studentController.editPassword);
router.post("/update-password", studentController.validationChainUpdatePassword, studentController.validateUpdatePassword);

router.get("/enroll", studentController.enroll);


router.get("/signup", studentController.signUp);
router.post("/new", studentController.validationChainEmailCheck, studentController.validateEmailCheck, studentController.redirectView);
router.post("/login", studentController.validationChainLogIn, studentController.validateLogIn);

router.get("/logout", studentController.logout, studentController.redirectView);


router.get("/registered-students", studentController.getAllStudents);

module.exports = router;
