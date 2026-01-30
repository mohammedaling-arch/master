async function test() {
    try {
        console.log('Testing /api/staff...');
        // First login to get a token
        const loginRes = await fetch('http://localhost:5000/api/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@crms.com',
                password: 'adminpassword'
            })
        });

        if (!loginRes.ok) {
            console.error('Login failed with status:', loginRes.status);
            const text = await loginRes.text();
            console.error('Response:', text);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful, token received');

        // Try to get staff
        const staffRes = await fetch('http://localhost:5000/api/staff', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('GET /api/staff status:', staffRes.status);
        if (staffRes.ok) {
            const staffList = await staffRes.json();
            console.log('Staff members found:', staffList.length);
        } else {
            console.error('GET /api/staff failed:', await staffRes.text());
        }

        // Try to create staff
        const createRes = await fetch('http://localhost:5000/api/staff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                name: 'Test Officer',
                email: `test${Date.now()}@crms.com`,
                password: 'password123',
                role: 'jurat',
                status: 'active'
            })
        });

        console.log('POST /api/staff status:', createRes.status);
        const createData = await createRes.json();
        console.log('POST /api/staff result:', createData);

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

test();
