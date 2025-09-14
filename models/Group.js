import mongoose from "mongoose";
const { Schema, model } = mongoose;

const studentAttendanceSchema = new Schema(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    attended: { type: Boolean, default: false },
    notes: { type: String, default: "" },
    nextRevision: { type: Object, default: "" },
  },
  { _id: false }
);

const lessonSchema = new Schema(
  {
    date: { type: Date, default: Date.now },
    students: [studentAttendanceSchema],
  },
  { timestamps: true }
);

const groupSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    students: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    lessons: [lessonSchema],
    notes: { type: String, default: "" },
    day: { type: String, default: "" },
    time: { type: String, default: "" },
  },
  { timestamps: true }
);

export default model("Group", groupSchema);
