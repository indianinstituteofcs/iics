exports.sendRoot = (req, res) => {
    console.log("GET:root:");
    console.log(req.query);
    res.render("index",{name: 'Home'});
};

exports.sendClass = (req, res) => {
    console.log("GET:about:");
    console.log(req.query);
    res.render("class");
};

exports.sendAbout = (req, res) => {
    console.log("GET:about:");
    console.log(req.query);
    res.render("about");
};

exports.logPathRequests = (req, res, next) => {
    console.log(`Path Logger: request made for: ${req.url}`);
    next();
};

/*
exports.sendForRequestedVegetable = (req, res) => {
    let veg = req.params.vegetable;
    res.send(`This is the page for ${veg}`);
 };

 
exports.respondWithName = (req, res) => {
    let paramsName = req.params.myName;
    console.log("In respondWithName");
    console.log(req.query);
    res.render("index",{name: paramsName});
};
*/