// require('dotenv').config(); // Keep this for local development
// require('./models/User');
// require('./models/Event');
// require('./models/PlatformEarning');
// const functions = require("firebase-functions");
// const express = require("express");
// const mongoose = require("mongoose");
// const bodyParser = require("body-parser");
// const cors = require("cors");
// const path = require("path");

require("dotenv").config(); // This must be at the very top
require("./models/User");
require("./models/Event");
require("./models/PlatformEarning");

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");
const path = require("path");

if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: "event-management-1a68f",
    private_key_id: "d8a3fc87067a16a7067b0f1b80db49b49006bcab",
    private_key:
      "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCge+663t47RVre\nbT43moC4PabtXTHZbvTCnl+KLWPWyGVzJKrIIzcL00t3cAggqYuGTzQbdKQWoWdK\ny9TW9icMipQL7bWnDqmPZuW3g3CAhUU6Wbtnif5giuwZ5MWuGyHI5X9BZc9MGWxu\nnb/TBeDUFWYyh47WsuS/nTr+b7hl5X9qkXynLSsKAcmhjqBw4ZtsloL4BiGJUuHi\nucwh1gFUJrcsuVJmpmc8yp5Hu8EgmU4ThWfyfncZ773hLWfGu6fBULjUZ34bPwoO\nYlpiIRmOev2S5lpv1JXGE50PAjvmwcGS2XA5mBOXupG6MVmmdiOB60z8/uGVsULZ\nyG6pVbrzAgMBAAECggEAOjDl/f19AGnkCp36/ud3gBbe1dfCkRByELWjd/OAbauJ\nWah0gpB+T7vkc+D8GXfQvzkt8DypmQkabp0dRnrH6vy+tNqTUQl4gyZw6ktvOjLY\nyNErql33jmMhPDxfT4PICtPogjqb4YCgeDWcDjTl8pD11yGfMgt49V/aOdMhvlRX\nhjcas0Zv5BWYeaKPqjckGIJPAHcfqcxvhL0336FyN50FCvmyr7ehhL93epohiFTH\nMh3cAKEjrD13bdH8/4T0O3b/8oSQbmTlRNmqftxoOgtOHYYLh9TRh6Om4En6XSib\njexLCKhqKqhsEITkeAvHVQ1Hm6n7TcShC4rL3EGf+QKBgQDP8b8k7pZVgnZvpH+T\nUvdFiVySqVmzlc6rNFXwYYuhbAGc9m1IkdfON6EPU2gPKQfIrhAGGdl9FeWuogEN\nzVm8O1ZIvHq3TCfjnNOWUEFhdh4PUH01zYa54HcoNf93UeniNBPeQjFhdtK9Vcr0\n9pR0Y1BgYHTNEYOY1NgQWNoc6QKBgQDFkmD4akkS9hWdW/jtDzDmR49fWcNIXDzu\nigNZTfzHlXYBLnZsHjhsCh+V8fourdddy+sS85zYY8PeDhJU58vfl+QXMMcWotJF\nuafPGdSnjHNbpgUYZbxNr3GFbB2D4j2sZfQX1H4MPK6uzRG2siFj9ZpD8SXuUY6+\n1f+BWji/ewKBgGDgOzC1hownz42LkXPNPy3CJMKe6w9jR3kzVKY8i5SUgNvjYl5g\ns6169SnyrZQChYHUtdphyJUh0nNdPihz9s5exn/0bydd72d29Iwer5b8NFzmHq8m\nJRILpPey0GWCX/fmUytEo0TI2r0ibv9YsSjX6+Y6ia/P7QMSheZ3voWhAoGARLdW\nts/wvoGMnwCAIaNo9I7rFNTZkO9T2ftykrsHMjuPoXWRhqU0Jo+W0MYqp9Wa1Gq6\nRgspADIiy7bFNXaxeAESOeajOAJFdC7QaL2pMuUssjGaEBRCXBqrNyaVVWt4299R\n+H/Vn1fzwaRdhteJuYSQtRTIho0jQsiXZ1wD5MUCgYB1erxJBzmUXQJeBfTQY0FC\nnGb26fidTxSXzn32oEhu5ipmcMh6zNWLkzI+HA6oNPeybEAxdDpjDOiD+RoaXMUU\nu/gME78zrlyBBtF9/3A523b5Z6dycNJDJte9jqg+Kv0dxPIYlTlIUKN1EZspTmsU\nBbPHKefn+wCfjH/SsfB72g==\n-----END PRIVATE KEY-----\n",
    client_email:
      "firebase-adminsdk-fbsvc@event-management-1a68f.iam.gserviceaccount.com",
    client_id: "115249309454063412799",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url:
      "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40event-management-1a68f.iam.gserviceaccount.com",
    universe_domain: "googleapis.com",
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "event-management-1a68f.appspot.com",
  });
}

const app = express();
const allowedOrigins = [
  "https://www.eventcircle.site",
  "https://eventcircle.site",
  "http://localhost:5173",
  "https://project-events-latest.vercel.app"
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "x-device-type",
  ],
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const sendEmail = require("./routes/sendEmail");

// Database connection with caching
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const dbUrl = process.env.MONGODB_URI;
  if (!dbUrl) {
    console.error("FATAL ERROR: MongoDB connection string is not defined.");
    throw new Error("MongoDB connection string is not defined.");
  }

  try {
    const client = await mongoose.connect(dbUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 10000,
      bufferCommands: false,
    });

    cachedDb = client;
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Database middleware
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/send", sendEmail);

// Dummy test route for sanity check
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "Test route works!" });
});

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Health check
app.get("/", (req, res) => {
  res.status(200).send("Server is healthy");
});

// Error handling
app.use((err, req, res, next) => {
  console.log("\n=== ERROR HANDLER TRIGGERED ===");
  console.log("\n=== Error Details ===");
  console.log("Timestamp:", new Date().toISOString());
  console.log("Request URL:", req.originalUrl);
  console.log("Request Method:", req.method);
  console.log("Error Message:", err.message);
  console.log("Error Stack:", err.stack);
  console.log("Request Body:", JSON.stringify(req.body, null, 2));
  console.log("==================\n");

  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "Something went wrong",
    details: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Local development server
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`CORS configured for: ${allowedOrigins.join(", ")}`);
  });
}

// Export for Vercel
const serverless = require("serverless-http");
module.exports = serverless(app);

