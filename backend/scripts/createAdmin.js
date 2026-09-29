require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

async function createAdmin() {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in the environment.");
  }

  if (ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  await mongoose.connect(MONGO_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("That email already belongs to an account; no account was changed.");
  }

  const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    password,
    role: "admin"
  });

  console.log("Admin account created. Credentials were not printed.");
}

createAdmin()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
