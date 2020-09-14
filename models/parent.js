const passportLocalMongoose = require("passport-local-mongoose");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const ParentSchema = new mongoose.Schema({
  name:{
    first: {
      type: String,
      required: true
    },
    last: {
      type: String,
      required: true
    }
  },
  students: {
    type:[],
    //type: [{type: Schema.Types.ObjectId, ref: "Student"}],
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase:true,
    unique:true
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
},
  {
    timestamps:true
});

ParentSchema.virtual("fullName")
  .get(function() {
    return `${this.name.first} ${this.name.last}`;
  });

ParentSchema.plugin(passportLocalMongoose, {usernameField: "email"});

const Parent = mongoose.model("Parent", ParentSchema);

module.exports = Parent;

/*
//encrypt password everytime a parent object is saved.
ParentSchema.pre("save", function(next) {
  let user = this;
  bcrypt.hash(user.password, 10).then(hash => {
    user.password = hash;
    next();
  })
      
  .catch(error => {
    console.log(`Error in hashing password: ${error.message}`);
    next(error);
  });
});

//Passwords are compared using bcrypt - the encryption engine.
ParentSchema.methods.passwordComparision = function(inputPassword){
  let user = this;

  return bcrypt.compare(inputPassword, user.password);
}
*/