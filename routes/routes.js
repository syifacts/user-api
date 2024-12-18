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
        { userId: newUser._id }, // Payload
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

      // Membuat access token
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "yourSecretKeyHere",
        { expiresIn: "1h" }
      );

      // Membuat refresh token
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "yourSecretKeyHere"
      );

      // Mengembalikan nama pengguna, username, userId, dan token
      return h
        .response({
          accessToken,
          refreshToken,
          username: user.username,
          name: user.name,  // Menambahkan 'name' dalam respons
          userId: user._id,
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
      // Verifikasi refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET || "yourSecretKeyHere"
      );

      // Membuat access token baru
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
      return h.response({ message: "Token is valid", userId: decoded.userId }).code(200);
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
      const users = await User.find({}, "-password"); // Exclude password field
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
      const user = await User.findById(id, "-password"); // Exclude password field
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

// Endpoint GET untuk Register
const getRegisterRoute = {
  method: "GET",
  path: "/register",
  handler: async (request, h) => {
    return h
      .response({ message: "You can use POST /register to register a user." })
      .code(200);
  },
};

// Endpoint GET untuk Login
const getLoginRoute = {
  method: "GET",
  path: "/login",
  handler: async (request, h) => {
    return h
      .response({ message: "You can use POST /login to login." })
      .code(200);
  },
};

// Endpoint GET untuk refresh token
const getRefreshRoute = {
  method: "GET",
  path: "/refresh-token",
  handler: async (request, h) => {
    return h
      .response({ message: "You can use POST /refresh-token to refresh your token." })
      .code(200);
  },
};
// Endpoint PUT untuk mengubah password
const changePasswordRoute = {
  method: "PUT",
  path: "/change-password",
  handler: async (request, h) => {
    const { oldPassword, newPassword } = request.payload;
    const { authorization } = request.headers;

    if (!authorization) {
      return h.response({ message: "Authorization header is required" }).code(400);
    }

    try {
      // Mendekode token dari header Authorization
      const token = authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "yourSecretKeyHere");

      // Mencari user berdasarkan ID
      const user = await User.findById(decoded.userId);
      if (!user) {
        return h.response({ message: "User not found" }).code(404);
      }

      // Memeriksa kecocokan password lama dengan yang ada di database
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return h.response({ message: "Old password is incorrect" }).code(400);
      }

      // Meng-hash password baru
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Memperbarui password pengguna
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
  getAllUsersRoute,   // Endpoint untuk semua user
  getUserByIdRoute,   // Endpoint untuk user berdasarkan ID
  getRegisterRoute,
  getLoginRoute,
  getRefreshRoute,
  changePasswordRoute,
};
