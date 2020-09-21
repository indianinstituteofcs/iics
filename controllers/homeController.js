const fName ="homeController:"

exports.getRoot = (req, res) => {
    console.log(fName + "getRoot:/:");
    res.render("index",{title:"IICS:Home"});
};

exports.getClass = (req, res) => {
    console.log(fName + "getClass:");
    res.render("class",{title:"IICS:Class"});
};

exports.getAbout = (req, res) => {
    console.log(fName + "getAbout:");
    res.render("about",{title:"IICS:About"});
};
