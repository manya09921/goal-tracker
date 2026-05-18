require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");

const seed = async () => {
  await connectDB();

  await User.deleteMany({});
  console.log("🗑️  Cleared users");

  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@1234",
    role: "admin",
  });

  const manager = await User.create({
    name: "Jane Manager",
    email: "manager@example.com",
    password: "Manager@1234",
    role: "manager",
  });

  const employee1 = await User.create({
    name: "Alice Employee",
    email: "alice@example.com",
    password: "Alice@1234",
    role: "employee",
    managerId: manager._id,
  });

  const employee2 = await User.create({
    name: "Bob Employee",
    email: "bob@example.com",
    password: "Bob@1234",
    role: "employee",
    managerId: manager._id,
  });

  console.log("✅ Seeded users:");
  console.log(`   Admin:    admin@example.com     / Admin@1234`);
  console.log(`   Manager:  manager@example.com   / Manager@1234`);
  console.log(`   Employee: alice@example.com     / Alice@1234`);
  console.log(`   Employee: bob@example.com       / Bob@1234`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
