import mongoose from "mongoose";

const { Schema, model } = mongoose;

/**
 * nextRevision schema: holds the surah and ayah range for revision.
 * count is optional (toAyah - fromAyah + 1).
 */
const revisionSchema = new Schema(
  {
    surah: { type: [String], required: true },
    fromAyah: { type: [Number], required: true },
    toAyah: { type: [Number], required: true },
    count: { type: [Number] } // optional
  },
  { _id: false } // don't generate a separate _id for nested object
);

/**
 * History entry per student, e.g., after a lesson.
 */
const historySchema = new Schema(
  {
    group: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    date: { type: Date, default: Date.now },
    revised: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    nextRevision: { type: revisionSchema, default: null } // structured object
  },
  { _id: true }
);

/**
 * Student model.
 */
const studentSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    history: { type: [historySchema], default: [] } // array of history entries
  },
  { timestamps: true }
);

// Virtual to count how many lessons / history entries the student has
studentSchema.virtual("lessonsCount").get(function () {
  return this.history ? this.history.length : 0;
});

// text index for searching by name
studentSchema.index({ name: "text" });

export default model("Student", studentSchema);
