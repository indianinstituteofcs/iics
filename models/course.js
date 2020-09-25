"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const CourseSchema = new Schema({
    name:{
        type: String,
        required: true
    },
    uniqueId: {//teacher...number...semester...year...starttime...endtime
        type:String,
        required: true,
        unique:true
    },
    registeration:{
        startreg:{
            type:Date,
            required: true
        },
        endreg:{
            type:Date,
            required: true
        }
    },
    cost: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    outcomes: {
        type: [String],
        required: true
    },
    prerequisites: {
        type: String,
        required: true
    },
    classdates:{
        type:[Date],
        required:true
    },
    syllabus: {
        type: [String],
        required: true
    },
    lectures: {
        type: [String],
        required: true
    },
    assignments: {
        type: [String],
        required: true,
    }
},
{
    timestamps:true
});

//0=>teacher, 1=>number, 2=>semester, 3=>year, 4=>starttime, 5=>endtime
CourseSchema.virtual("teacher").get(function() {
    return `${this.uniqueId.split("...")[0]}`;
});

CourseSchema.virtual("coursenumber").get(function() {
    return `${this.uniqueId.split("...")[1]}`;
});

CourseSchema.virtual("semester").get(function() {
    return `${this.uniqueId.split("...")[2]}`;
});

CourseSchema.virtual("year").get(function() {
    return `${this.uniqueId.split("...")[3]}`;
});

CourseSchema.virtual("starttime").get(function() {
    return `${this.uniqueId.split("...")[4]}`;
});

CourseSchema.virtual("endtime").get(function() {
    return `${this.uniqueId.split("...")[5]}`;
});

CourseSchema.virtual("termOffered").get(function() {
    return `${this.semester}:${this.year}`;
});

CourseSchema.virtual("classTime").get(function() {
    return `${this.starttime}:${this.endtime}`;
});

CourseSchema.virtual("courseId").get(function() {
    return `IICS${this.coursenumber}`;
});

module.exports = mongoose.model("Course", CourseSchema);;
