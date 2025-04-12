const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

// Email and password validators
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => password.length >= 6;

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1️⃣ Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // 2️⃣ Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // 3️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5️⃣ Send welcome email
    const subject = "Welcome to Our Platform!";
    const htmlContent = `
      <h3>Hello ${name},</h3>
      <p>Welcome to our platform! We're excited to have you on board.</p>
      <p>You can now log in and start using the services.</p>
      <p>Cheers,<br>Your App Team</p>
    `;

    await sendEmail(email, subject, htmlContent);

    // 4️⃣ Create the new user (no role now)
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // 6️⃣ Response
    res.status(201).json({
      message: "User registered successfully. Welcome email sent.",
      user,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res
      .status(500)
      .json({ error: "Registration failed", details: error.message });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: "Login failed", details: error.message });
  }
};

// Generate random 6-digit OTP
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// Step 1: Request OTP
exports.requestOtpLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP via email
    await sendEmail(
      email,
      "Your OTP for Login",
      `<h3>Hello ${user.name},</h3><p>Your OTP is <strong>${otp}</strong>. It will expire in 5 minutes.</p>`
    );

    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send OTP", details: error.message });
  }
};

// Step 2: Verify OTP & Login
exports.verifyOtpLogin = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({ error: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log(user.otp);
    if (user.otp !== otp || new Date() > user.otpExpiry) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "3h",
    });

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    res
      .status(500)
      .json({ error: "OTP verification failed", details: error.message });
  }
};


// 📊 Get number of users registered each day
exports.getDailyUserRegistrations = async (req, res) => {
  try {
    const result = await User.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          registrations: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ data: result });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch registrations", details: error.message });
  }
};
