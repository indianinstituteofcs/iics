"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const ParentSchema = new Schema({
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
  }
},
  {
    timestamps:true
});

ParentSchema.virtual("fullName").get(function() {
    return `${this.name.first} ${this.name.last}`;
  });

ParentSchema.plugin(passportLocalMongoose, {usernameField: "email"});

module.exports = mongoose.model("Parent", ParentSchema);;
