const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user"); // Mengimpor model User dari file models

// Endpoint Register
const registerRoute = {
  method: "POST",
  path: "/register",
  handler: async (request, h) => {
    const { name, username, password } = request.payload;
    try {
      const userExists = await User.findOne({ username });
      if (userExists) {
        return h.response({ message: "Username already exists" }).code(400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, username, password: hashedPassword });

      await newUser.save();

      // Membuat token setelah registrasi
      const accessToken = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET || "yourSecretKeyHere",
        { expiresIn: "1h" }
      );

      return h
        .response({ message: "User registered successfully", accessToken })
        .code(201);
    } catch (err) {
      console.error("Error during user registration:", err);
      return h.response({ message: "Error registering user" }).code(500);
    }
  },
};

// Endpoint Login
const loginRoute = {
  method: "POST",
  path: "/login",
  handler: async (request, h) => {
    const { username, password } = request.payload;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return h.response({ message: "Invalid credentials" }).code(400);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return h.response({ message: "Invalid credentials" }).code(400);
      }

      // Membuat access token dan refresh token
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "yourSecretKeyHere",
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "yourSecretKeyHere"
      );

      return h
        .response({
          accessToken,
          refreshToken,
          username: user.username,
          userId: user._id,
          name: user.name, // Menambahkan nama ke respons
        })
        .code(200);
    } catch (err) {
      console.error("Error during login:", err);
      return h.response({ message: "Error logging in" }).code(500);
    }
  },
};

// Endpoint untuk mendapatkan access token baru menggunakan refresh token
const refreshRoute = {
  method: "POST",
  path: "/refresh-token",
  handler: async (request, h) => {
    const { refreshToken } = request.payload;

    if (!refreshToken) {
      return h.response({ message: "Refresh token is required" }).code(400);
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || "yourSecretKeyHere"
      );

      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || "yourSecretKeyHere",
        { expiresIn: "1h" }
      );

      return h.response({ accessToken: newAccessToken }).code(200);
    } catch (err) {
      return h.response({ message: "Invalid refresh token" }).code(400);
    }
  },
};

// Endpoint untuk memverifikasi token
const verifyTokenRoute = {
  method: "POST",
  path: "/verify-token",
  handler: async (request, h) => {
    const { token } = request.payload;

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "yourSecretKeyHere"
      );
      return h
        .response({ message: "Token is valid", userId: decoded.userId })
        .code(200);
    } catch (err) {
      return h.response({ message: "Invalid token" }).code(400);
    }
  },
};

// Endpoint GET untuk semua pengguna
const getAllUsersRoute = {
  method: "GET",
  path: "/users",
  handler: async (request, h) => {
    try {
      const users = await User.find({}, "-password");
      return h.response({ users }).code(200);
    } catch (err) {
      console.error("Error fetching users:", err);
      return h.response({ message: "Error fetching users" }).code(500);
    }
  },
};

// Endpoint GET user berdasarkan ID
const getUserByIdRoute = {
  method: "GET",
  path: "/users/{id}",
  handler: async (request, h) => {
    const { id } = request.params;
    try {
      const user = await User.findById(id, "-password");
      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }
      return h.response({ user }).code(200);
    } catch (err) {
      console.error("Error fetching user:", err);
      return h.response({ message: "Error fetching user" }).code(500);
    }
  },
};

// Endpoint untuk memperbarui password
const updatePasswordRoute = {
  method: "PUT",
  path: "/users/{id}/password",
  handler: async (request, h) => {
    const { id } = request.params;
    const { oldPassword, newPassword } = request.payload;
    const token = request.headers.authorization?.split(" ")[1];

    try {
      if (!token) {
        return h.response({ message: "Authorization token is required" }).code(401);
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKeyHere");
      if (decoded.userId !== id) {
        return h.response({ message: "Unauthorized" }).code(403);
      }

      const user = await User.findById(id);
      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return h.response({ message: "Old password is incorrect" }).code(400);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      return h.response({ message: "Password updated successfully" }).code(200);
    } catch (err) {
      console.error("Error updating password:", err);
      return h.response({ message: "Error updating password" }).code(500);
    }
  },
};

// Export semua routes
module.exports = {
  registerRoute,
  loginRoute,
  refreshRoute,
  verifyTokenRoute,
  getAllUsersRoute,
  getUserByIdRoute,
  updatePasswordRoute, // Tambahan untuk update password
};
