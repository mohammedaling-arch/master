/**
 * Test script for Applicant Management API endpoints
 * Run this after logging in as a staff user to get a valid token
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Replace with actual staff token after login
const STAFF_TOKEN = 'YOUR_STAFF_TOKEN_HERE';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Authorization': `Bearer ${STAFF_TOKEN}`,
        'Content-Type': 'application/json'
    }
});

async function testApplicantEndpoints() {
    console.log('🧪 Testing Applicant Management Endpoints\n');

    try {
        // Test 1: Get all applicants
        console.log('1️⃣ Testing GET /applicants');
        const applicantsRes = await api.get('/applicants');
        console.log(`✅ Success: Found ${applicantsRes.data.length} applicants\n`);

        // Test 2: Create new applicant
        console.log('2️⃣ Testing POST /applicants');
        const newApplicant = {
            firstName: 'Test',
            middleName: 'User',
            surname: 'Applicant',
            gender: 'male',
            age: 30,
            email: `test.applicant.${Date.now()}@example.com`,
            phone: '+256700000000',
            address: '123 Test Street',
            nin: 'TEST123456789'
        };
        const createRes = await api.post('/applicants', newApplicant);
        console.log(`✅ Success: Created applicant with ID ${createRes.data.id}\n`);
        const applicantId = createRes.data.id;

        // Test 3: Get single applicant
        console.log('3️⃣ Testing GET /applicants/:id');
        const getOneRes = await api.get(`/applicants/${applicantId}`);
        console.log(`✅ Success: Retrieved applicant ${getOneRes.data.first_name} ${getOneRes.data.surname}\n`);

        // Test 4: Update applicant
        console.log('4️⃣ Testing PUT /applicants/:id');
        const updateData = {
            ...getOneRes.data,
            phone: '+256711111111',
            status: 'active'
        };
        await api.put(`/applicants/${applicantId}`, updateData);
        console.log('✅ Success: Updated applicant\n');

        // Test 5: File affidavit for applicant
        console.log('5️⃣ Testing POST /applicants/:id/affidavit');
        const affidavitData = {
            type: 'Test Affidavit',
            content: 'This is a test affidavit content',
            amount: 50000
        };
        const affidavitRes = await api.post(`/applicants/${applicantId}/affidavit`, affidavitData);
        console.log(`✅ Success: Filed affidavit with ID ${affidavitRes.data.id}\n`);

        // Test 6: File probate for applicant
        console.log('6️⃣ Testing POST /applicants/:id/probate');
        const probateData = {
            deceasedName: 'Test Deceased Person'
        };
        const probateRes = await api.post(`/applicants/${applicantId}/probate`, probateData);
        console.log(`✅ Success: Filed probate application with ID ${probateRes.data.id}\n`);

        // Test 7: Get applicant's affidavits
        console.log('7️⃣ Testing GET /applicants/:id/affidavits');
        const affidavitsRes = await api.get(`/applicants/${applicantId}/affidavits`);
        console.log(`✅ Success: Found ${affidavitsRes.data.length} affidavit(s) for applicant\n`);

        // Test 8: Get applicant's probate applications
        console.log('8️⃣ Testing GET /applicants/:id/probate');
        const probateListRes = await api.get(`/applicants/${applicantId}/probate`);
        console.log(`✅ Success: Found ${probateListRes.data.length} probate application(s) for applicant\n`);

        // Test 9: Delete applicant
        console.log('9️⃣ Testing DELETE /applicants/:id');
        await api.delete(`/applicants/${applicantId}`);
        console.log('✅ Success: Deleted applicant\n');

        console.log('🎉 All tests passed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
            console.log('\n⚠️  Make sure to replace STAFF_TOKEN with a valid staff authentication token');
            console.log('   You can get this by logging in as a staff user and copying the token from localStorage or the network tab');
        }
    }
}

// Instructions
if (STAFF_TOKEN === 'YOUR_STAFF_TOKEN_HERE') {
    console.log('⚠️  Please update STAFF_TOKEN in this file before running tests\n');
    console.log('To get a staff token:');
    console.log('1. Open the app in browser');
    console.log('2. Login as a staff user (admin, jurat, etc.)');
    console.log('3. Open browser console and run: localStorage.getItem("staffToken")');
    console.log('4. Copy the token and replace STAFF_TOKEN in this file');
    console.log('5. Run: node test_applicant_api.js\n');
} else {
    testApplicantEndpoints();
}
