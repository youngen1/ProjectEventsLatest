require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");
const nodemailer = require("nodemailer");
const {
  createTransferRecipient,
  initiateTransfer,
  chargeCard,
} = require("../utils/paystack");
const Ticket = require("../models/Ticket");
const functions = require("firebase-functions");
const JWT_SECRET = process.env.JWT_SECRET;
const mongoose = require("mongoose");

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === "465",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD,
    },
  });
};

exports.registerUser = async (req, res) => {
  console.log("🚀 Register route hit");
  console.log("📥 Request body:", req.body);

  const {
    fullname,
    dateOfBirth,
    email,
    phone_number,
    password,
    profile_picture,
    gender,
  } = req.body;

  try {
    console.log("🔍 Checking if user already exists...");
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("⚠️ Email already exists:", email);
      return res.status(400).json({ message: "Email already exists" });
    }

    console.log("🔐 Hashing password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("🔐 Password hashed");

    const newUserData = {
      fullname,
      dateOfBirth,
      email,
      phone_number,
      password: hashedPassword,
      profile_picture,
      gender,
      isVerified: false,
      followers: [],
      following: [],
      my_tickets: [],
      total_earnings: 0,
      role: "user",
    };

    console.log("📦 Creating new user:", newUserData);
    const newUser = new User(newUserData);

    console.log("💾 Saving new user...");
    await newUser.save();
    console.log("✅ User saved successfully:", newUser._id);

    console.log("🔐 Generating verification token...");
    const verificationToken = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("🔗 Verification token generated");

    const verificationLink = `${FRONTEND_URL}/verify-email/${verificationToken}`;
    console.log("🔗 Verification link:", verificationLink);

    console.log("📤 Preparing to send verification email...");
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Welcome to EventCircle - Email Verification",
      html: `
        <h2>Welcome to EventCircle!</h2>
        <p>Thank you for registering. Please click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });
    console.log("✅ Verification email sent to:", email);

    res.status(201).json({
      message:
        "Registration successful. Please check your email for verification link.",
      requiresVerification: true,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  console.log("🔐 Login attempt started");
  console.log("📥 Credentials received:", { email, password });

  try {
    console.log("🔎 Searching for user with email:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log("🔐 Checking password...");
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Incorrect password for user:", email);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!user.isVerified) {
      console.log("📭 User not verified. Sending verification email...");

      const verificationToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;

      const transporter = createEmailTransporter();
      await transporter.sendMail({
        from: EMAIL_USER,
        to: email,
        subject: "Email Verification Required",
        html: `
          <h2>Email Verification Required</h2>
          <p>Please click the link below to verify your email:</p>
          <a href="${verificationLink}">Verify Email</a>
          <p>This link will expire in 1 hour.</p>
        `,
      });

      console.log("✅ Verification email sent to:", email);
      return res.status(403).json({
        message: "Please verify your email. A verification link has been sent.",
        requiresVerification: true,
      });
    }

    console.log("✅ User verified. Generating auth token...");
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    console.log("🔄 Fetching user data without password...");
    const userWithoutPassword = await User.findOne({ email })
      .select(
        "fullname username email profile_picture followers following my_tickets role"
      )
      .populate({
        path: "followers following",
        select: "fullname username profile_picture",
      });

    console.log("✅ Login successful for user:", email);
    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("❌ Login failed due to error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    if (user.isVerified) {
      return res
        .status(200)
        .json({ message: "Email already verified. Please log in." });
    }

    user.isVerified = true;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        message:
          "Verification link has expired. Please login to get a new one.",
      });
    }
    res.status(500).json({ message: "Error verifying email" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  console.log("🔧 Password reset request initiated");
  console.log("📥 Request body:", req.body);

  const { email } = req.body;

  try {
    console.log("🔍 Looking for user with email:", email);
    const user = await User.findOne({ email });

    if (!user) {
      console.log("❌ No user found with email:", email);
      return res.status(404).json({ message: "Email not found" });
    }

    console.log("✅ User found:", user._id);

    console.log("🔐 Generating reset token...");
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });

    const resetLink = `${FRONTEND_URL}/reset-password/${token}`;
    console.log("🔗 Reset link generated:", resetLink);

    console.log("📤 Preparing to send reset email...");
    const transporter = createEmailTransporter();

    await transporter.sendMail({
      from: EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    console.log("✅ Reset email sent successfully to:", email);
    res.status(200).json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("❌ Error during password reset request:", error);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  console.log("🔧 Password reset process started");
  console.log("📥 Incoming data:", {
    token: token?.slice(0, 30) + "...",
    newPassword,
  }); // Hide password in logs

  try {
    console.log("🔍 Verifying token...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified. Decoded ID:", decoded.id);

    console.log("🔎 Searching for user in database...");
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("❌ User not found for ID:", decoded.id);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("🔐 Hashing new password...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    console.log("💾 Updating user password...");
    user.password = hashedPassword;
    await user.save();

    console.log("✅ Password reset successful for user:", user._id);
    res
      .status(200)
      .json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      console.log("⏰ Token expired");
      return res
        .status(400)
        .json({ message: "Reset link has expired. Please request a new one." });
    }

    console.error("❌ Error during password reset:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};

exports.changePasswordAfterLogin = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error changing password" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { fullname, dateOfBirth, phone_number, profile_picture, username } =
    req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) {
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    if (fullname) user.fullname = fullname;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (phone_number) user.phone_number = phone_number;
    if (profile_picture) user.profile_picture = profile_picture;
    if (username) user.username = username;

    await user.save();

    const updatedUser = await User.findById(userId).select(
      "fullname username email profile_picture dateOfBirth phone_number"
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

exports.attachBankAccount = async (req, res) => {
  const userId = req.user.id;
  const { bank_account_number, bank_code } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.bank_account_number = bank_account_number;
    user.bank_code = bank_code;
    await user.save();

    res.status(200).json({
      message: "Bank account attached successfully",
      user: {
        bank_account_number: user.bank_account_number,
        bank_code: user.bank_code,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error attaching bank account" });
  }
};

exports.getMyTickets = async (req, res) => {
  const userId = req.user.id;

  console.log("in backend route of my-tickets userid is", userId);
  try {
    const user = await User.findById(userId).populate({
      path: "my_tickets",
      options: { sort: { createdAt: -1 } },
      populate: {
        path: "created_by",
        select: "fullname username email profile_picture",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("the tickets in backend are", user.my_tickets);
    res.status(200).json(user.my_tickets); // ⬅️ send all Event fields + populated created_by
  } catch (error) {
    console.error("error is", error);
    res.status(500).json({ message: "Error fetching tickets" });
  }
};

exports.requestWithdrawal = async (req, res) => {
  const userId = req.user.id;
  const { card_number, card_expiry_month, card_expiry_year, card_cvv } =
    req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const amountToWithdraw = Math.round(user.total_earnings * 100);
    if (amountToWithdraw < 5000) {
      return res
        .status(400)
        .json({ message: "Minimum withdrawal amount is NGN 50" });
    }

    const withdrawal = new Withdrawal({
      user: userId,
      amount: amountToWithdraw,
      status: "pending",
    });
    await withdrawal.save();

    try {
      const chargeResult = await chargeCard(user.email, amountToWithdraw, {
        card_number,
        card_expiry_month,
        card_expiry_year,
        card_cvv,
      });

      const recipientData = await createTransferRecipient(
        chargeResult.data.authorization.authorization_code,
        user.fullname
      );

      const transfer = await initiateTransfer(
        amountToWithdraw,
        recipientData.data.recipient_code
      );

      if (transfer.status === "success") {
        withdrawal.status = "completed";
        withdrawal.transactionReference = transfer.data.reference;
        await withdrawal.save();

        user.total_earnings = 0;
        await user.save();

        return res.status(200).json({
          message: "Withdrawal successful",
          amount: amountToWithdraw / 100,
          reference: transfer.data.reference,
        });
      }

      withdrawal.status = "failed";
      await withdrawal.save();
      return res.status(400).json({ message: "Transfer failed" });
    } catch (error) {
      withdrawal.status = "failed";
      await withdrawal.save();
      return res.status(500).json({ message: "Payment processing failed" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error processing withdrawal" });
  }
};

exports.getWithdrawalHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const withdrawals = await Withdrawal.find({ user: userId })
      .sort({ createdAt: -1 })
      .select("amount status createdAt transactionReference");

    res.status(200).json(withdrawals);
  } catch (error) {
    res.status(500).json({ message: "Error fetching withdrawal history" });
  }
};

exports.followUser = async (req, res) => {
  const userId = req.user.id;
  const { followId } = req.params;

  try {
    if (userId === followId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    const [user, userToFollow] = await Promise.all([
      User.findById(userId),
      User.findById(followId),
    ]);

    if (!userToFollow) {
      return res.status(404).json({ message: "User to follow not found" });
    }

    if (user.following.includes(followId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    user.following.push(followId);
    userToFollow.followers.push(userId);

    await Promise.all([user.save(), userToFollow.save()]);

    res.status(200).json({ message: "Successfully followed user" });
  } catch (error) {
    res.status(500).json({ message: "Error following user" });
  }
};

exports.unfollowUser = async (req, res) => {
  const userId = req.user.id;
  const { followId } = req.params;

  try {
    const [user, userToUnfollow] = await Promise.all([
      User.findById(userId),
      User.findById(followId),
    ]);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User to unfollow not found" });
    }

    user.following = user.following.filter((id) => id.toString() !== followId);
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== userId
    );

    await Promise.all([user.save(), userToUnfollow.save()]);

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    res.status(500).json({ message: "Error unfollowing user" });
  }
};

exports.getUserById = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId)
      .select(
        "fullname username email profile_picture followers following my_tickets role"
      )
      .populate({
        path: "followers following",
        select: "fullname username profile_picture",
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

exports.getFollowers = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate({
      path: "followers",
      select: "fullname username email profile_picture followers following",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.followers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching followers" });
  }
};

exports.getFollowing = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate({
      path: "following",
      select: "fullname username email profile_picture followers following",
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user.following);
  } catch (error) {
    res.status(500).json({ message: "Error fetching following list" });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const adminEmail = "mtswenisabelo301@gmail.com";
    const user = await User.findOne({ email: adminEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ message: "User is already an admin" });
    }

    user.role = "admin";
    await user.save();

    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: EMAIL_USER,
      to: adminEmail,
      subject: "Admin Access Granted",
      html: `
        <h2>Admin Access Granted</h2>
        <p>You have been granted admin access to EventCircle.</p>
        <p>You now have access to additional features and controls.</p>
      `,
    });

    res.status(200).json({
      message: "User has been made admin successfully",
      user: {
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error making user admin" });
  }
};

exports.getPlatformEarnings = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: "confirmed" });
    const totalEarnings = tickets.reduce((sum, ticket) => {
      return sum + ticket.price * 0.13;
    }, 0);

    const monthlyEarnings = await Ticket.aggregate([
      { $match: { status: "confirmed" } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          earnings: { $sum: { $multiply: ["$price", 0.13] } },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);

    res.status(200).json({
      totalEarnings,
      monthlyEarnings,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching platform earnings" });
  }
};
