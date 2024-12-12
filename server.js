const Hapi = require('@hapi/hapi');
const mongoose = require('mongoose');
require('dotenv').config();
const { registerRoute, loginRoute, refreshRoute, getRegisterRoute, getLoginRoute } = require('./routes/routes');

// Fungsi untuk menghubungkan ke MongoDB
const startMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
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

    // Menambahkan middleware CORS secara manual
    server.ext('onPreResponse', (request, h) => {
        const response = request.response;

        // Menambahkan CORS ke setiap respons, jika response error atau tidak
        response.output.headers['Access-Control-Allow-Origin'] = '*'; // Ganti dengan origin spesifik jika di produksi
        response.output.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        response.output.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

        return h.continue;
    });

    // Menangani preflight request untuk metode OPTIONS
    server.route({
        method: 'OPTIONS',
        path: '/{any*}', // Mengizinkan semua route
        handler: (request, h) => {
            return h
                .response('Preflight Request Handled')
                .header('Access-Control-Allow-Origin', '*')
                .header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                .header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        },
    });

    // Register route-routes yang diimpor
    server.route(registerRoute);
    server.route(loginRoute);
    server.route(refreshRoute);
    server.route(getRegisterRoute);
    server.route(getLoginRoute);

    // Memulai server
    await server.start();
    console.log('Server running on %s', server.info.uri);
};

// Menghubungkan ke MongoDB dan memulai server
startMongoDB()
    .then(() => init())
    .catch((err) => {
        console.error('Server initialization error:', err);
        process.exit(1);
    });
