const mongoose = require('mongoose');

// Membuat model User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true }, // Pastikan username unik
  password: { type: String, required: true },
  userId: { type: String, unique: true, default: () => new mongoose.Types.ObjectId() }, // Optional, jika ingin menggunakan custom userId
  token: { type: String, default: null }, // Token untuk autentikasi, misalnya JWT
});

// Membuat model berdasarkan schema
const User = mongoose.model('User', userSchema);

module.exports = User;
