const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user'); // Mengimpor model User dari file models

// Endpoint Register
const registerRoute = {
  method: 'POST',
  path: '/register',
  handler: async (request, h) => {
    const { name, username, password } = request.payload;
    try {
      const userExists = await User.findOne({ username });
      if (userExists) {
        return h.response({ message: 'Username already exists' }).code(400);
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, username, password: hashedPassword });

      await newUser.save();
      return h.response({ message: 'User registered successfully' }).code(201);
    } catch (err) {
      console.error('Error during user registration:', err);
      return h.response({ message: 'Error registering user' }).code(500);
    }
  },
};

// Endpoint Login
const loginRoute = {
  method: 'POST',
  path: '/login',
  handler: async (request, h) => {
    const { username, password } = request.payload;
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return h.response({ message: 'Invalid credentials' }).code(400);
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return h.response({ message: 'Invalid credentials' }).code(400);
      }

      // Membuat access token dengan expired time 1 jam
      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'yourSecretKeyHere',
        { expiresIn: '1h' } // Token ini kedaluwarsa dalam 1 jam
      );

      // Membuat refresh token tanpa expired time
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'yourSecretKeyHere'
      );

      return h.response({ accessToken, refreshToken, username: user.username }).code(200);
    } catch (err) {
      return h.response({ message: 'Error logging in' }).code(500);
    }
  },
};

// Endpoint untuk mendapatkan access token baru menggunakan refresh token
const refreshRoute = {
  method: 'POST',
  path: '/refresh-token',
  handler: async (request, h) => {
    const { refreshToken } = request.payload;

    if (!refreshToken) {
      return h.response({ message: 'Refresh token is required' }).code(400);
    }

    try {
      // Verifikasi refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'yourSecretKeyHere');
      
      // Membuat access token baru dengan userId dari refresh token
      const newAccessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || 'yourSecretKeyHere',
        { expiresIn: '1h' } // Set expired time sesuai kebutuhan
      );
      
      return h.response({ accessToken: newAccessToken }).code(200);
    } catch (err) {
      return h.response({ message: 'Invalid refresh token' }).code(400);
    }
  },
};


// Endpoint GET untuk Register
const getRegisterRoute = {
  method: 'GET',
  path: '/register',
  handler: async (request, h) => {
    return h.response({ message: 'You can use POST /register to register a user.' }).code(200);
  },
};

// Endpoint GET untuk Login
const getLoginRoute = {
  method: 'GET',
  path: '/login',
  handler: async (request, h) => {
    return h.response({ message: 'You can use POST /login to login.' }).code(200);
  },
};

module.exports = { registerRoute, loginRoute, refreshRoute, getRegisterRoute, getLoginRoute };
