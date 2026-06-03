import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();


const MONGO_URI = `${process.env.MONGO_URL}/${process.env.MONGO_DB}`;
console.log("MONGO_URI:", MONGO_URI);



const users = [
    // Role 1 — regular users
    {
        name: "Alice Walker",
        email: "alice@example.com",
        password: "password123",
        role: 1,
        isVerified: true,
    },
    {
        name: "Bob Smith",
        email: "bob@example.com",
        password: "password123",
        role: 1,
        isVerified: false,
    },

    // Role 2 — moderator/manager
    {
        name: "Carol Mod",
        email: "carol@example.com",
        password: "password123",
        role: 2,
        isVerified: true,
    },
    {
        name: "Dave Mod",
        email: "dave@example.com",
        password: "password123",
        role: 2,
        isVerified: true,
    },

    // Role 3 — admin
    {
        name: "Eve Admin",
        email: "eve@example.com",
        password: "password123",
        role: 3,
        isVerified: true,
    },

    // Edge cases
    {
        name: "Blocked User",
        email: "blocked@example.com",
        password: "password123",
        role: 1,
        isVerified: true,
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: "Violated terms of service",
    },
    {
        name: "Deleted User",
        email: "deleted@example.com",
        password: "password123",
        role: 1,
        isVerified: true,
        isDeleted: true,
        deletedAt: new Date(),
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("DB connected");

        await User.deleteMany({});
        console.log("Cleared existing users");

        // Use create() so pre-save hook fires (password gets hashed)
        const created = await User.create(users);
        console.log(`Seeded ${created.length} users:`);

        created.forEach(u =>
            console.log(`  [role:${u.role}] ${u.email}`)
        );

    } catch (err) {
        console.error("Seed failed:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("DB disconnected");
    }
}

seed();