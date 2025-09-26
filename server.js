import dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}
import express from "express";
import authRouter from "./routers/auth.js";
import studentsRouter from './routers/students.js'
import mongoose from "mongoose";
import groupsRouter from "./routers/groups.js"


import cors from "cors";
const app = express();

app.use(express.json());
const allowedOrigins = [
  process.env.LOCAL_FRONT_ENDPOINT,
  process.env.FRONT_END_ENDPOINT,
];

app.use(
  cors({ 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter)
app.use("/api/groups", groupsRouter)
mongoose.connect(process.env.DATABASE_URL);
const db =  mongoose.connection;
db.on("error", (error) => console.error(error.name)); 
db.once("open", () => console.log("connected to mongoose"));
app.listen(process.env.PORT)

  