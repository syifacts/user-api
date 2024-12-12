// middleware/auth.js

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // Ambil token dari header Authorization
  const token = req.header('Authorization')?.replace('Bearer ', ''); // Mengambil token tanpa kata 'Bearer'
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verifikasi token menggunakan JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKeyHere');
    req.userId = decoded.userId;  // Menyimpan userId dalam request untuk digunakan di route lainnya
    next(); // Lanjutkan ke route handler berikutnya
  } catch (err) {
    return res.status(400).json({ message: 'Invalid token.' });
  }
};

module.exports = verifyToken;
