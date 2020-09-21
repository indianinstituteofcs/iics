"use strict";

const   router = require("express").Router();
const   studentRoutes = require("./studentRoutes");
const   homeRoutes = require("./homeRoutes");
const   errorRoutes = require("./errorRoutes");

/* Order is important. Search for routes depends on the order here.*/
router.use("/student", studentRoutes);
router.use("/", homeRoutes);
router.use("/", errorRoutes);


module.exports = router;