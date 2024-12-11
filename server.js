const Hapi = require('@hapi/hapi');
const mongoose = require('mongoose');
require('dotenv').config();
const { registerRoute, loginRoute, getRegisterRoute, getLoginRoute } = require('./routes/routes'); // Mengimpor route dengan benar

// Fungsi untuk menghubungkan ke MongoDB
const startMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

// Fungsi untuk menginisialisasi server Hapi.js
const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 5000,
        host: '0.0.0.0',
    });

    // Register CORS middleware
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;

        if (response.isBoom) {
        response.output.headers['Access-Control-Allow-Origin'] = '*'; // Ganti dengan origin yang lebih spesifik jika diperlukan
        response.output.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'; 
        response.output.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        } else {

        // Menambahkan CORS untuk semua response
        response.headers['Access-Control-Allow-Origin'] = '*'; // Ganti dengan origin yang lebih spesifik jika diperlukan
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'; 
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
        }
        // Menangani preflight request (OPTIONS)
        if (request.method === 'options') {
            return h.response().code(200); // Kode status 200 untuk OPTIONS
        }

        return h.continue;
    });

    // Register route-routes yang diimpor
    server.route(registerRoute);
    server.route(loginRoute);
    server.route(getLoginRoute);
    server.route(getRegisterRoute);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

// Menghubungkan ke MongoDB dan memulai server
startMongoDB().then(() => {
    init().catch(err => {
        console.error('Server initialization error:', err);
        process.exit(1);
    });
});
