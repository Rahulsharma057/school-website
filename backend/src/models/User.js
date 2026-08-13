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

    // NEW: used for fee-due SMS reminders (parent/guardian) and general contact.
    // Optional so existing users without a phone don't break validation.
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    role: {
      type: String,

      enum: [
        "SUPER_ADMIN",
        "ADMIN",
        "PRINCIPAL",
        "TEACHER",
        "ACCOUNTANT",
        "STUDENT",
        "PARENT",
      ],

      default: "STUDENT",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
lastLogin: { type: Date, default: null },
  },

  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);



