import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
// import speakeasy from "speakeasy";
// import nodemailer from "nodemailer";
import verifyMiddleWare from "./verifyMiddleWare.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// const sendCodeToEmail = (code, email) => {
  
//   var transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: "omarilpa09@gmail.com",
//       pass: "fdecormslqjlysws",
//     },
//   });

//   var mailOptions = {
//     from: "omarilpa09@gmail.com",
//     to: email,
//     subject: "Verification Code for Note App",
//     text: "Enter the Code Below to Verify you Email \n " + code,
//   };

//   transporter.sendMail(mailOptions, function (error, info) {
//     if (error) {
//       console.log(error);
//     } else {
//       console.log("Email sent: " + info.response);
//     }
//   });
// };
// const generateOTPCode = () => {
//   const secret = speakeasy.generateSecret({ length: 20 });
//   const code = speakeasy.totp({
//     secret: secret.base32,
//     encoding: "base32",
//   });
//   return code;
// };
// const verifyOTP = (usersCode, newUser) => {
//   if (newUser.codeDigit != null)
//     return newUser.codeDigit.toString().trim() === usersCode.trim();
// };
router.get("/home", verifyMiddleWare, async (req, res) => {
  if (req.user == null) {
    res.status(500)
  }
})
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User doesn't Exist", success: false });
    }
    const passIsTrue = await bcrypt.compare(password, user.password);

    if (passIsTrue) {
      const token = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.TOKEN_SECRET
      );
      console.log("loged in");
      return res.json({
        success: true,
        message: "User Loged in Succefully",
        token: token,
      });
    } else {
      res.json({ success: false, message: "Wrong credentials" });
      console.log(password, user.password, email, user.email, user);
      console.log(passIsTrue);
    }
  } catch (err) {
    res.json({ success: false, message: err });
    console.log(err);
  }
});

router.get("/verify", verifyMiddleWare, async (req, res) => {
  return res.status(200).json({success: true, user: req.user})
})

setTimeout(async () => {
  const unVerifiedUsers = await User.find({ verified: false });
  unVerifiedUsers.forEach(async (user) => {
    await user.deleteOne();
  });
}, 5 * 60 * 1000);
export default router;
