const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
const JWT_SECRET = "brainbarter_secret_key_2024";

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/myapp")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

// ========================
// User Schema & Model
// ========================
const userSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, default: "student" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// ========================
// Skill Schema & Model
// ========================
const skillSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skillName:   { type: String, required: true },
    level:       { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    description: { type: String, default: "" },
}, { timestamps: true });

const Skill = mongoose.model("Skill", skillSchema);

// ========================
// Match Schema & Model
// ========================
const matchSchema = new mongoose.Schema({
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    providerId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill:       { type: String, required: true },
    status:      { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
    message:     { type: String, default: "" },
}, { timestamps: true });

const Match = mongoose.model("Match", matchSchema);

// ========================
// Auth Middleware
// ========================
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No token provided" });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (err) {
        console.log("Auth error:", err.message);
        res.status(401).json({ message: "Invalid token" });
    }
};

// ========================
// Routes
// ========================

// Test route
app.get("/", (req, res) => {
    res.send("Server is running 🚀");
});

// ========================
// Auth Routes (used by frontend)
// ========================

// POST /api/auth/signup → Register new user
app.post("/api/auth/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log("Signup request received:", { name, email });

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        console.log("✅ User registered and saved to DB:", user.name, user.email);

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        // Send response (without password)
        res.status(201).json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.log("Signup error:", err.message);
        res.status(500).json({ message: "Signup failed", error: err.message });
    }
});

// POST /api/auth/login → Login user
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("Login request received:", email);

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        console.log("✅ User logged in:", user.name);

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "7d" });

        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        console.log("Login error:", err.message);
        res.status(500).json({ message: "Login failed", error: err.message });
    }
});

// GET /api/auth/me → Get current logged-in user
app.get("/api/auth/me", authMiddleware, async (req, res) => {
    try {
        console.log("✅ User fetched (me):", req.user.name);
        res.json(req.user);
    } catch (err) {
        console.log("Auth me error:", err.message);
        res.status(500).json({ message: "Failed to get user" });
    }
});

// ========================
// Simple User APIs (for testing/Postman)
// ========================

// POST /add-user → Quick add (no auth)
app.post("/add-user", async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        console.log("✅ User saved via /add-user:", user.name);
        res.send("User saved successfully");
    } catch (err) {
        console.log("Error saving user:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /users → Fetch all users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        console.log("✅ Users fetched:", users.length, "found");
        res.json(users);
    } catch (err) {
        console.log("Error fetching users:", err.message);
        res.status(500).json({ error: err.message });
    }
});

// ========================
// Skill APIs
// ========================

// POST /add-skill → Add a skill for a user
app.post("/add-skill", async (req, res) => {
    try {
        const { userId, skillName, level, description } = req.body;

        if (!userId || !skillName) {
            return res.status(400).json({ error: "userId and skillName are required" });
        }

        const skill = new Skill({ userId, skillName, level, description });
        await skill.save();

        console.log("✅ Skill saved:", skillName, "for user:", userId);
        res.status(201).json({ message: "Skill added successfully", skill });
    } catch (err) {
        console.log("Error saving skill:", err.message);
        res.status(500).json({ error: "Failed to add skill", details: err.message });
    }
});

// GET /skills/:userId → Get all skills of a specific user
app.get("/skills/:userId", async (req, res) => {
    try {
        const skills = await Skill.find({ userId: req.params.userId });
        console.log("✅ Skills fetched for user:", req.params.userId, "-", skills.length, "found");
        res.status(200).json(skills);
    } catch (err) {
        console.log("Error fetching skills:", err.message);
        res.status(500).json({ error: "Failed to fetch skills", details: err.message });
    }
});

// ========================
// Match APIs
// ========================

// POST /add-match → Create a match request between two users
app.post("/add-match", async (req, res) => {
    try {
        const { requesterId, providerId, skill, message } = req.body;

        if (!requesterId || !providerId || !skill) {
            return res.status(400).json({ error: "requesterId, providerId, and skill are required" });
        }

        const match = new Match({ requesterId, providerId, skill, message });
        await match.save();

        console.log("✅ Match created:", requesterId, "→", providerId, "for skill:", skill);
        res.status(201).json({ message: "Match request created", match });
    } catch (err) {
        console.log("Error creating match:", err.message);
        res.status(500).json({ error: "Failed to create match", details: err.message });
    }
});

// GET /matches/:userId → Get all matches for a specific user (as requester or provider)
app.get("/matches/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;
        const matches = await Match.find({
            $or: [{ requesterId: userId }, { providerId: userId }]
        })
        .populate("requesterId", "name email")
        .populate("providerId", "name email");

        console.log("✅ Matches fetched for user:", userId, "-", matches.length, "found");
        res.status(200).json(matches);
    } catch (err) {
        console.log("Error fetching matches:", err.message);
        res.status(500).json({ error: "Failed to fetch matches", details: err.message });
    }
});

// Start server
app.listen(5000, () => {
    console.log("Server running on port 5000");
});