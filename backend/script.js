require("dotenv").config();
const mongoose = require("mongoose");

// Load models (adjust paths if needed)
require("./models/User");
require("./models/Event");
require("./models/Ticket"); // Optional: only if Ticket is a separate model

const User = mongoose.model("User");
const Event = mongoose.model("Event");
// const Ticket = mongoose.model('Ticket'); // Uncomment if needed

const MONGODB_URI = process.env.MONGODB_URI;

// CHANGE THESE IDS
const userIdToCheck = "6841738854bc31c4872be84e";
const ticketIdToCheck = "";
const eventIdToCheck = "68413a3adb7dfea25b7fc6ce";

async function verifyOwnership() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Check if user has the ticket
    const user = await User.findById(userIdToCheck).lean();
    if (!user) {
      console.log("❌ User not found");
    } else {
      const userHasTicket = user.tickets?.some((ticket) => {
        return typeof ticket === "object"
          ? ticket._id.toString() === ticketIdToCheck
          : ticket.toString() === ticketIdToCheck;
      });

      console.log(
        userHasTicket
          ? "✅ User owns the ticket"
          : "❌ User does NOT own the ticket"
      );
    }

    // 2. Check if event has the ticket
    const event = await Event.findById(eventIdToCheck).lean();
    if (!event) {
      console.log("❌ Event not found");
    } else {
      const eventHasTicket = event.tickets?.some((ticket) => {
        return typeof ticket === "object"
          ? ticket._id.toString() === ticketIdToCheck
          : ticket.toString() === ticketIdToCheck;
      });

      console.log(
        eventHasTicket
          ? "✅ Event includes the ticket"
          : "❌ Event does NOT include the ticket"
      );
    }

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (err) {
    console.error("💥 Error:", err.message);
    process.exit(1);
  }
}

verifyOwnership();
