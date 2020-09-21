"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const StudentSchema = new Schema({
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
  email: {
    type: String,
    required: true,
    lowercase:true,
    unique:true
  },
  enrolled: {
    type: Boolean,
    required: true,
  }
},
  {
    timestamps:true
});

StudentSchema.virtual("fullName").get(function() {
    return `${this.name.first} ${this.name.last}`;
  });

StudentSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("Student", StudentSchema);;
