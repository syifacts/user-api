const mongoose = require('mongoose');

// Membuat model User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true }, // Pastikan username unik
  password: { type: String, required: true },
  userId: { type: String, unique: true, default: () => new mongoose.Types.ObjectId() }, // ID unik
  token: { type: String, default: null }, // Access token untuk autentikasi
  refreshToken: { type: String, default: null }, // Refresh token untuk mendapatkan access token baru
}, { versionKey: false }); // Menghilangkan versionKey (timestamps sudah dihilangkan)

const User = mongoose.model('User', userSchema);

module.exports = User;
