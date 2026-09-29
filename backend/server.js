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

const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin is not allowed by CORS"));
    }
}));
app.use(express.json());

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