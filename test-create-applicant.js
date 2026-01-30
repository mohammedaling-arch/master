// Test script to debug applicant creation
const axios = require('axios');
const FormData = require('form-data');

async function testCreateApplicant() {
    try {
        // First, login to get a token (replace with your staff credentials)
        const loginRes = await axios.post('http://localhost:5000/api/staff/login', {
            username: 'admin',  // Replace with actual staff username
            password: 'admin123'  // Replace with actual staff password
        });

        const token = loginRes.data.token;
        console.log('✓ Login successful');

        // Create form data
        const formData = new FormData();
        formData.append('firstName', 'Test');
        formData.append('middleName', 'Middle');
        formData.append('surname', 'User');
        formData.append('gender', 'male');
        formData.append('age', '30');
        formData.append('email', 'test@example.com');
        formData.append('phone', '1234567890');
        formData.append('address', '123 Test Street');
        formData.append('nin', 'NIN123456');

        console.log('Attempting to create applicant...');

        const createRes = await axios.post('http://localhost:5000/api/applicants', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('✓ Applicant created successfully:', createRes.data);
    } catch (error) {
        console.error('✗ Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.error('Error details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testCreateApplicant();
