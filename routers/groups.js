import express from "express";
import mongoose from "mongoose";
import verifyMiddleWare from "./verifyMiddleWare.js";
import Group from "../models/Group.js";
import Student from "../models/Student.js"; // your existing Student model

const router = express.Router();

/**
 * Create a group
 * POST /api/groups
 * body: { title: string, studentIds: [ObjectId], notes?: string }
 */
router.post("/", verifyMiddleWare, async (req, res) => {
  try {
    const { title, day, time, studentIds = [], notes = "" } = req.body;
    const group = new Group({ title, students: studentIds, notes, day, time });
    await group.save();
    return res.status(201).json({ success: true, group });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Error creating group: " + err.message,
    });
  }
});

/**
 * Get all groups (populate membership)
 * GET /api/groups
 */
router.get("/", async (req, res) => {
  try {
    const groups = await Group.find().populate("students", "name notes");
    return res.json({ success: true, groups });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Couldn't fetch groups: " + err.message,
    });
  }
});

/**
 * Start a lesson for a group
 * POST /api/groups/:groupId/lessons
 * Creates a lesson instance based on current group.students.
 * Body optional: { date } (if you want custom date)
 */
router.post("/:groupId/lessons", verifyMiddleWare, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date } = req.body;

    const group = await Group.findById(groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    // Create students entries from group's membership
    const lesson = {
      date: date ? new Date(date) : new Date(),
      students: group.students.map((sId) => ({
        student: sId,
        attended: false,
      })),
    };

    group.lessons.push(lesson);
    await group.save();

    const newLesson = group.lessons[group.lessons.length - 1];
    return res.status(201).json({ success: true, lesson: newLesson });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Couldn't start lesson: " + err.message,
    });
  }
});
router.put(
  "/:groupId/lessons/:lessonId/students/:studentId",
  verifyMiddleWare,
  async (req, res) => {
    try {
      const { groupId, lessonId, studentId } = req.params;
      const { attended, notes, nextRevision } = req.body;

      const group = await Group.findById(groupId);
      if (!group) return res.status(404).json({ message: "Group not found" });

      const lesson = group.lessons.id(lessonId);
      if (!lesson) return res.status(404).json({ message: "Lesson not found" });

      const studentEntry = lesson.students.find(
        (s) => s.student.toString() === studentId
      );
      if (!studentEntry)
        return res.status(404).json({ message: "Student not in this lesson" });

      // Update fields
      if (attended !== undefined) studentEntry.attended = !!attended;
      if (notes !== undefined) studentEntry.notes = String(notes || "");
      studentEntry.nextRevision = nextRevision;

      await group.save();

      res.json({ success: true, studentEntry });
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "Error updating student: " + err.message });
    }
  }
);
// DELETE /api/groups/:groupId
router.delete("/:groupId", verifyMiddleWare, async (req, res) => {
  try {
    const { groupId } = req.params;

    const deletedGroup = await Group.findByIdAndDelete(groupId);
    if (!deletedGroup)
      return res.status(404).json({ message: "Group not found" });

    res.json({ success: true, message: "Group deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting group: " + err.message });
  }
});

/**
 * Finalize a lesson (save attendance + push student.history)
 * POST /api/groups/:groupId/lessons/:lessonId/end
 * body: {
 *   attendance: [
 *     { studentId: "...", attended: true/false, notes: "...", nextRevision: "..." },
 *     ...
 *   ]
 * }
 */ // Finalize lesson
router.post(
  "/:groupId/lessons/:lessonId/end",
  verifyMiddleWare,
  async (req, res) => {
    const { groupId, lessonId } = req.params;
    const { attendance = [] } = req.body;

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const group = await Group.findById(groupId).session(session);
      if (!group) throw new Error("Group not found");

      const lesson = group.lessons.id(lessonId);
      if (!lesson) throw new Error("Lesson not found");

      // Apply final attendance map
      const map = {};
      attendance.forEach((a) => (map[a.studentId] = a));

      lesson.students.forEach((sEntry) => {
        const key = sEntry.student.toString();
        const a = map[key];
        if (a) {
          sEntry.attended = !!a.attended;
          sEntry.notes = a.notes || "";
          sEntry.nextRevision = a.nextRevision || "";
        }
      });

      await group.save({ session });

      // Update Student.history for those attended
      for (const a of attendance) {
        if (!a.attended) continue;

        await Student.findByIdAndUpdate(
          a.studentId,
          {
            $push: {
              history: {
                group: group._id,
                date: lesson.date,
                revised: true,
                notes: a.notes || "",
                nextRevision: a.nextRevision || "",
              },
            },
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      const updated = await Group.findById(groupId)
        .populate("students", "name")
        .populate("lessons.students.student", "name");

      return res.json({
        success: true,
        message: "Lesson finalized",
        group: updated,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error(err);
      return res.status(500).json({
        success: false,
        message: "Error finalizing lesson: " + err.message,
      });
    }
  }
);
// routes/groups.js
router.get("/:id", async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate("students") // get student info
      .populate("lessons.students.student"); // deep populate inside lessons
    // pulls full student docs
    if (!group) return res.status(404).json({ error: "Group not found" });

    res.json({ group });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch group" });
  }
});

export default router;
