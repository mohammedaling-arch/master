const axios = require('axios');

async function testEndpoints() {
    try {
        console.log('1. Logging in as Staff...');
        const loginRes = await axios.post('http://localhost:5000/api/staff/login', {
            email: 'admin@highcourt.com', // Assuming this user exists from previous context or seed
            password: 'password123'      // Common default
        });

        const token = loginRes.data.token;
        console.log('Login successful. Token acquired.');
        const headers = { Authorization: `Bearer ${token}` };

        console.log('\n2. Testing Pending Affidavits Endpoint...');
        const pendingRes = await axios.get('http://localhost:5000/api/staff/affidavits/pending-verification', { headers });
        console.log(`Status: ${pendingRes.status}, Records: ${pendingRes.data.length}`);
        if (pendingRes.data.length > 0) console.log('Sample:', pendingRes.data[0]);

        console.log('\n3. Testing All Affidavits Endpoint...');
        const allRes = await axios.get('http://localhost:5000/api/staff/affidavits/all', { headers });
        console.log(`Status: ${allRes.status}, Records: ${allRes.data.length}`);

        console.log('\n4. Testing Deponents Endpoint...');
        const deponentsRes = await axios.get('http://localhost:5000/api/staff/deponents', { headers });
        console.log(`Status: ${deponentsRes.status}, Records: ${deponentsRes.data.length}`);
        if (deponentsRes.data.length > 0) console.log('Sample:', deponentsRes.data[0]);

    } catch (error) {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error('Connection Error:', error.message);
        }
    }
}

testEndpoints();
