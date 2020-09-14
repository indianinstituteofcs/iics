exports.getRoot = (req, res) => {
    console.log("GET:/:");
    res.render("index");
};

exports.getClass = (req, res) => {
    console.log("GET:class:");
    res.render("class");
};

exports.getAbout = (req, res) => {
    console.log("GET:about:");
    res.render("about");
};
