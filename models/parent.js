const mongoose = require('mongoose');

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
  password: {
    type: String,
    required: true
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

const Parent = mongoose.model("Parent", ParentSchema);

module.exports = Parent;