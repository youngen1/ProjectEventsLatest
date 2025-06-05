require("dotenv").config();
const mongoose = require("mongoose");

// Load models
require("./models/User");
require("./models/Event");

const User = mongoose.model("User");
const Event = mongoose.model("Event");

const MONGODB_URI = process.env.MONGODB_URI;

// 🔁 Change this to the user ID you want to inspect
const userIdToInspect = "6841738854bc31c4872be84e";

async function inspectUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Fetch the user and populate their tickets
    const user = await User.findById(userIdToInspect)
      .populate({
        path: "my_tickets",
        model: "Event",
        select: "title location start_date end_date", // Select relevant fields
      })
      .lean();

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("👤 User Details:");
    console.log("-----------------------------");
    console.log("Full Name:", user.fullname);
    console.log("Username:", user.username);
    console.log("Email:", user.email);
    console.log("Phone Number:", user.phone_number);
    console.log("Verified:", user.isVerified);
    console.log("Role:", user.role);
    console.log("Gender:", user.gender);
    console.log("Total Earnings:", user.total_earnings);
    console.log("Created At:", user.createdAt);
    console.log("Updated At:", user.updatedAt);

    console.log("\n🎟️ Tickets (my_tickets):");
    if (user.my_tickets?.length > 0) {
      user.my_tickets.forEach((ticket, index) => {
        console.log(`  [${index + 1}] Event ID: ${ticket._id}`);
        console.log(`      Title: ${ticket.title}`);
        console.log(`      Location: ${ticket.location}`);
        console.log(`      Start Date: ${ticket.start_date}`);
        console.log(`      End Date: ${ticket.end_date}`);
      });
    } else {
      console.log("  No tickets found.");
    }

    console.log("\n👥 Followers:", user.followers?.length || 0);
    console.log("👤 Following:", user.following?.length || 0);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("💥 Error:", err.message);
    process.exit(1);
  }
}

inspectUser();
