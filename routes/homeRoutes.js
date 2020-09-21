"use strict";

const   router = require("express").Router();
const   homeController = require("../controllers/homeController");

router.get("/", homeController.getRoot);
router.get("/about", homeController.getAbout);
router.get("/class", homeController.getClass);

module.exports = router;

