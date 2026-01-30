async function checkEndpoints() {
    try {
        console.log('1. Logging in as Staff...');
        const loginRes = await fetch('http://localhost:5000/api/staff/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'cfo@highcourt.com', password: 'password123' })
        });

        if (!loginRes.ok) {
            console.log('Login failed:', loginRes.status, await loginRes.text());
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Login successful.');

        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('\n2. Testing Pending Affidavits (GET)...');
        const url = 'http://localhost:5000/api/staff/affidavits/pending-verification';
        const res = await fetch(url, { headers });
        console.log(`URL: ${url} -> Status: ${res.status}`);

        console.log('\n3. Testing All Affidavits (GET)...');
        const url2 = 'http://localhost:5000/api/staff/affidavits/all';
        const res2 = await fetch(url2, { headers });
        console.log(`URL: ${url2} -> Status: ${res2.status}`);

        console.log('\n4. Testing Deponents (GET)...');
        const url3 = 'http://localhost:5000/api/staff/users/deponents';
        const res3 = await fetch(url3, { headers });
        console.log(`URL: ${url3} -> Status: ${res3.status}`);

    } catch (e) {
        console.error('Script error:', e.message);
    }
}
checkEndpoints();
