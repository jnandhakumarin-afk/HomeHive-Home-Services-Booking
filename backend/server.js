const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const homeRoutes = require("./routes/homeRoutes");
const applianceRoutes = require("./routes/applianceRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const providerRoutes = require("./routes/providerRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const serviceReportRoutes = require("./routes/serviceReportRoutes");
const billRoutes = require("./routes/billRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const reminderRoutes = require("./routes/reminderRoutes");
const passportRoutes = require("./routes/passportRoutes");
const adminRoutes = require("./routes/adminRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const seedDefaultServices = require("./config/seedServices");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/+$/, "");

        // 1. Check explicitly configured origins or wildcard
        if (allowedOrigins.includes("*") || allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        // 2. Allow any Vercel deployment preview or production domain (*.vercel.app)
        try {
            const parsed = new URL(normalizedOrigin);
            if (parsed.hostname.endsWith(".vercel.app") || parsed.hostname === "vercel.app") {
                return callback(null, true);
            }
            // 3. Allow local dev origins (localhost / 127.0.0.1 on any port)
            if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
                return callback(null, true);
            }
        } catch {
            // Invalid origin URL
        }

        // Reject without throwing unhandled 500 error
        return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/homes", homeRoutes);
app.use("/api/appliances", applianceRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/service-reports", serviceReportRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/passport", passportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/complaints", complaintRoutes);

// Health check endpoints
app.get(["/health", "/api/health"], (req, res) => {
    res.json({
        status: "ok",
        message: "HomeHive Backend is Healthy 🚀",
        timestamp: new Date().toISOString()
    });
});

app.get("/", (req, res) => {
    res.json({
        message: "HomeHive Backend is Running 🚀"
    });
});

mongoose
    .connect(process.env.MONGO_URI)
    .then(async () => {
        await seedDefaultServices();
        console.log("MongoDB Connected Successfully");

        app.listen(process.env.PORT || 5000, () => {
            console.log(`Server running on port ${process.env.PORT || 5000}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB Connection Error:", error);
    });