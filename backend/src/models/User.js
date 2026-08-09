const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

  role:{
type:String,

enum:[

"SUPER_ADMIN",
"ADMIN",
"PRINCIPAL",
"TEACHER",
"ACCOUNTANT",
"STUDENT",
"PARENT"

],

default:"STUDENT"
},

    isActive: {
      type: Boolean,
      default: true,
    },
createdBy:{
 type:mongoose.Schema.Types.ObjectId,
 ref:"User",
 default:null
}
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
