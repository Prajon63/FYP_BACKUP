/*
yesma, basically models bata prepared bhayeko data(user info,product/service info etc) lai k logic lagaune 
ra data lai kasari handle garne core logic hunxa 
*/

//models bata data import gareko
import { create, findOne } from '../models/User.js';
import crypto from "crypto";
import User from "../models/User.js";
import { sendResetEmail } from "../config/mailer.js";  

//used for encryption(data handling example, data safe rakhnu)
// import { hash, compare } from 'bcryptjs';   // yo method ni commomjs bhayo

import bcrypt from 'bcryptjs';
const {hash,compare}= bcrypt;  //hash() ra compare() is accessed from bcrypt now!!

//1
//yo async func ma register logic handle bhairaxa; router ma yo func export hunxa so exports.register is used
// export async function register(req, res) {
//   const { email, password } = req.body;  //input field empty narakhna lai
//   const hashed = await bcrypt.hash(password, 10);  //password property lai hash garne await
//   try {
//     const user = await create({ email, password: hashed });  //try bhitra user successfully create ra pw hashed bhako herxa
//     res.json({ success: true, user: { email } });
//   } catch (err) {
//     res.json({ success: false, error: 'Email already registered' });  //error ma only email taken falxa
//   }
// }


//2 
export async function register(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    
    const user = await create({ email, password: hashed });
    
    return res.status(201).json({ 
      success: true, 
      user: { _id: user._id, email: user.email } 
    });

  } catch (err) {
    console.error("Registration error:", err); // ← very important! log real error

    // Check for MongoDB duplicate key error (error code 11000)
    if (err.code === 11000) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email already registered' 
      });
    }

    // For all other errors, show more info (at least during development)
    return res.status(500).json({ 
      success: false, 
      error: 'Server error during registration',
      detail: err.message   // ← remove this in production!
    });
  }
}



//same as register
export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findOne({ email });  //user db ma xa ki nai check garxa
  if (user && await bcrypt.compare(password, user.password)) {  //if true bhayo bhane
    res.json({ success: true, user: { _id: user._id, email: user.email } });            // success dekhauxa
  } else {
    res.json({ success: false, error: 'Invalid credentials' });
  }
}

export async function preference(req,res) {
  const { userId, gender, ageRange } = req.body;
  // save preferences in DB
  res.json({ success: true, message: 'Preferences saved!' });
}

// FORGOT PASSWORD: send reset link
export const forgotPassword = async (req, res) => {
  try {
    console.log("🔐 Forgot password request received");
    const { email } = req.body;

    // Always return this message (prevents attackers from checking if email exists)
    const genericMsg = "If that email exists, a reset link has been sent.";

    if (!email) {
      console.log("❌ No email provided");
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    console.log("📧 Looking for user with email:", email.toLowerCase().trim());
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // If user not found, still return generic success
    if (!user) {
      console.log("⚠️  User not found, but returning generic message for security");
      return res.status(200).json({ success: true, message: genericMsg });
    }

    console.log("✅ User found, generating reset token");

    // create token (raw) + store hashed token in DB
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await user.save();
    console.log("💾 Reset token saved to database");

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink = `${frontendBase}/reset-password/${rawToken}`;
    console.log("🔗 Reset link:", resetLink);

    await sendResetEmail({ to: user.email, resetLink });
    console.log("✅ Password reset process completed");

    return res.status(200).json({ success: true, message: genericMsg });
  } catch (err) {
    console.error("❌ forgotPassword error:", err);
    return res.status(500).json({ success: false, error: "Server error", detail: err.message });
  }
};


// RESET PASSWORD: verify token + set new password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: "Reset token is required" });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Password and confirmPassword are required",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, error: "Password must be at least 6 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Invalid or expired reset token",
      });
    }

    // hash the new password (same style as register)
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;

    // clear reset fields
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error("resetPassword error:", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
};
