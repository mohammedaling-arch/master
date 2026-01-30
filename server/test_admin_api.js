const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'your-secret-key';

const test = async () => {
    // Generate a valid admin token
    const token = jwt.sign({ id: 1, type: 'staff', role: 'admin' }, SECRET, { expiresIn: '1h' });

    try {
        console.log('Testing Admin Stats...');
        const res = await axios.get(`${API_URL}/staff/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        console.error('Error Status:', err.response?.status);
        console.error('Error Data:', err.response?.data);
        console.error('Error Message:', err.message);
    }
};

test();
