const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    target: {
      type: Number,
      required: [true, "Target value is required"],
      min: [0, "Target must be non-negative"],
    },
    weightage: {
      type: Number,
      required: [true, "Weightage is required"],
      min: [10, "Weightage must be at least 10%"],
      max: [100, "Weightage cannot exceed 100%"],
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "completed"],
      default: "draft",
    },
    approved: {
      type: Boolean,
      default: false,
    },
    locked: {
      type: Boolean,
      default: false,
    },
    managerComment: {
      type: String,
      trim: true,
      maxlength: [500, "Manager comment cannot exceed 500 characters"],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent edits on locked goals (approved)
goalSchema.pre("save", function (next) {
  if (this.isModified("locked") && !this.locked) return next(); // allow unlocking by admin
  if (this.locked && !this.isNew) {
    const allowedFields = ["locked", "managerComment", "reviewedBy", "reviewedAt", "status", "approved"];
    const modifiedPaths = this.modifiedPaths();
    const illegalModification = modifiedPaths.some((p) => !allowedFields.includes(p));
    if (illegalModification) {
      return next(new Error("Cannot modify a locked (approved) goal"));
    }
  }
  next();
});

module.exports = mongoose.model("Goal", goalSchema);
