# Server Restart Instructions

## The Issue
The `/api/roles` endpoint returns 404 because the server is running old code without the new routes.

## Solution: Restart the Server

### Option 1: Using Terminal (Recommended)
1. Stop the current server (Ctrl+C in the terminal running the server)
2. Restart it:
   ```bash
   cd c:/laragon/www/crms/server
   node server.js
   ```

### Option 2: Using Laragon
1. Stop the Node.js server in Laragon
2. Start it again

### Option 3: Kill Process and Restart
```powershell
# Find and kill the process on port 5000
$process = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($process) {
    Stop-Process -Id $process.OwningProcess -Force
}

# Start the server
cd c:/laragon/www/crms/server
node server.js
```

## Verification

After restarting, test the endpoint:

```bash
# Without auth (should fail with 401)
curl http://localhost:5000/api/roles

# With auth token (should return roles)
# You need a valid token from staff login
```

Or use the check script:
```bash
node check_roles.js
```

## What Changed
- Added `/api/roles` CRUD endpoints
- Added `role_id` support in `/api/staff` endpoints
- These routes only exist in the updated `server.js` file
- Server must be restarted to load new routes

## Troubleshooting

### Still getting 404?
1. Check server console for startup errors
2. Verify the server started successfully
3. Check port 5000 is actually the CRMS server:
   ```bash
   curl http://localhost:5000/debug/routes
   ```
   Should show all routes including new `/api/roles` endpoints

### Port already in use?
```powershell
# Check what's on port 5000
netstat -ano | findstr :5000

# Kill the process (use PID from above)
taskkill /PID <PID> /F

# Restart server
node server.js
```
