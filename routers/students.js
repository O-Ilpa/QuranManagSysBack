import express from "express";
import verifyMiddleWare from "./verifyMiddleWare.js";
import Student from "../models/Student.js";
import mongoose from "mongoose";
import Group from "../models/Group.js";
const app = express();

app.use(express.json());
const router = express.Router();

router.post("/", verifyMiddleWare, async (req, res) => {
  try {
    const { name, notes } = req.body;

    const newStudent = new Student({
      name,
      notes,
      history: [],
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      student: newStudent,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Error creating student: " + err.message,
    });
  }
});
router.get("/", async (req, res) => {
  try {
    const students = await Student.find({});
    return res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      students: students.map((s) => ({
        _id: s._id,
        name: s.name,
        notes: s.notes,
        history: s.history,
      })),
    });
  } catch (err) {
    res.json({ success: false, message: "Couldn't fetch students: " + err });
  }
});
// DELETE
router.delete("/:id", verifyMiddleWare, async (req, res) => {
  console.time("deleting User");
  try {
    const { id } = req.params;
    const deletedUser = await Student.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error deleting user" });
  } finally {
    console.timeEnd("deleting User");
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const updatedUser = await Student.findByIdAndUpdate(
      id,
      { ...req.body }, // spread to update only provided fields
      { new: true, runValidators: true } // returns new doc + validates schema
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Updated successfully",
      student: updatedUser,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
});
router.get("/:id/history", verifyMiddleWare, async (req, res) => {
  try {
    const studentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid student id" });
    }

    // 1) load student and populate history.group title (so we can show group names there)
    const student = await Student.findById(studentId).populate(
      "history.group",
      "title"
    );
    if (!student)
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });

    // 2) Use aggregation on Group to extract lessons that include this student
    const oid = new mongoose.Types.ObjectId(studentId);
    const lessons = await Group.aggregate([
      { $match: { "lessons.students.student": oid } },
      // keep only necessary fields
      {
        $project: {
          title: 1,
          lessons: 1,
        },
      },
      { $unwind: "$lessons" },
      { $unwind: "$lessons.students" },
      { $match: { "lessons.students.student": oid } },
      {
        $project: {
          _id: 0,
          groupId: "$_id",
          groupTitle: "$title",
          lessonId: "$lessons._id",
          lessonDate: "$lessons.date",
          attended: "$lessons.students.attended",
          notes: "$lessons.students.notes",
          nextRevision: "$lessons.students.nextRevision",
        },
      },
      { $sort: { lessonDate: -1 } }, // most recent first
    ]);

    return res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        notes: student.notes,
        history: student.history, // populated with group titles
        createdAt: student.createdAt,
      },
      lessons,
    });
  } catch (err) {
    console.error("GET /api/students/:id/history error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching history: " + err.message,
      });
  }
});
export default router;
