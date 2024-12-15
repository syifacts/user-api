const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Membuat schema User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true},
  password: { type: String, required: true },
  userId: { type: String, unique: true, default: () => new mongoose.Types.ObjectId() },
  token: { type: String, default: null }, // Token bisa disimpan jika diperlukan
});

// Menambahkan metode untuk hashing password sebelum disimpan
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next(); // Hanya lakukan hash jika password diubah

  try {
    // Hash password dengan salt rounds 10
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (err) {
    next(err);
  }
});

// Metode untuk membandingkan password yang diinputkan dengan password yang tersimpan
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password); // Menggunakan bcrypt untuk membandingkan
};

// Membuat model berdasarkan schema
const User = mongoose.model("User", userSchema);

module.exports = User;
