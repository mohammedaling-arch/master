async function checkRoutes() {
    try {
        console.log('Checking active server routes...');
        const res = await fetch('http://localhost:5000/debug/routes');
        if (!res.ok) {
            console.log('Failed to fetch routes, status:', res.status);
            return;
        }
        const routes = await res.json();
        const relevantRoutes = routes.filter(r => r.includes('/api/staff/affidavits') || r.includes('/api/staff/deponents'));

        console.log('Relevant routes found on server:');
        console.log(relevantRoutes.join('\n'));

        if (relevantRoutes.length === 0) {
            console.log('Use Action: The server does not seem to have the new routes loaded.');
        } else {
            console.log('Server has the routes loaded.');
        }

    } catch (e) {
        console.error('Connection error:', e.message);
    }
}
checkRoutes();
