const mongoose = require("mongoose");

const checkinSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: [true, "Goal ID is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    quarter: {
      type: String,
      enum: ["Q1", "Q2", "Q3", "Q4"],
      required: [true, "Quarter is required"],
    },
    actualValue: {
      type: Number,
      required: [true, "Actual value is required"],
      min: [0, "Actual value must be non-negative"],
    },
    status: {
      type: String,
      enum: ["on_track", "at_risk", "behind", "completed"],
      required: [true, "Status is required"],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters"],
    },
  },
  { timestamps: true }
);

// One checkin per goal per quarter
checkinSchema.index({ goalId: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model("Checkin", checkinSchema);
