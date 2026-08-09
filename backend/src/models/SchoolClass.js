const mongoose = require("mongoose");

const schoolClassSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      unique: true,
    },

    // controls display order in dropdowns/listings
    order: {
      type: Number,
      default: 0,
    },

    status: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

schoolClassSchema.index({ order: 1 });

module.exports = mongoose.model("SchoolClass", schoolClassSchema);