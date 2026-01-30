@echo off
echo Testing applicant creation endpoint...
echo.

REM Test 1: Check if server is responding
curl -s http://localhost:5000/api/ping
echo.
echo.

echo If you see {"message":"pong",...} above, the server is running correctly.
echo.
echo Now try creating an applicant in the browser:
echo 1. Go to Staff Portal
echo 2. Navigate to Manage Applicants  
echo 3. Click Add Applicant
echo 4. Fill in the form and submit
echo.
echo Watch this terminal for any error messages.
echo.
pause
