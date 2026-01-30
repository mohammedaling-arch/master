async function checkRouteExistence() {
    try {
        console.log('Testing Pending Affidavits Endpoint without token...');
        const url = 'http://localhost:5000/api/staff/affidavits/pending-verification';
        const res = await fetch(url);

        console.log(`URL: ${url}`);
        console.log(`Status: ${res.status} ${res.statusText}`);

        if (res.status === 401) {
            console.log('Result: 401 Unauthorized -> Route EXISTS (Middleware caught it).');
        } else if (res.status === 404) {
            console.log('Result: 404 Not Found -> Route MISSING on server.');
        } else {
            console.log('Result: Unexpected status.');
        }

    } catch (e) {
        console.error('Script error:', e.message);
    }
}
checkRouteExistence();
