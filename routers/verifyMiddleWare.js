import jwt from "jsonwebtoken";
import Admin from "../models/admin.js";
const verifyMiddleWare = async (req, res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;
    if (!authorizationHeader) {
      req.user = null;
      return next();
    }
    const token = authorizationHeader.split(" ")[1];

    if (!token) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log(decoded)
    if (decoded.email != "ayman@mail.com") {
      return res.json({success:true, message: "Unauthorized"})
    }
    if (!decoded) {
      return res.json({ success: false, message: "Unauthorized" });
    }
    const user = await Admin.findById({ _id: decoded.id });
    if (!user) {
      return res.json({ success: false, message: "No user found" });
    }
    req.user = { id: user._id, role: user.role, name: user.name };

    next();
  } catch (err) {
    req.user = null;
    return res.json({ success: false, message: "there was an error: " + err });
  }
};

export default verifyMiddleWare;
