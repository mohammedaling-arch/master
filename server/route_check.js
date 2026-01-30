const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// We will just require the server.js to see what it registers, 
// but server.js starts the server at the bottom.
// Instead, let's just inspect the file directly or add a debug route.

console.log("Reading server.js to verify route definition...");
const serverContent = fs.readFileSync('server.js', 'utf8');
const hasRoute = serverContent.includes("app.post('/api/public/probate/:id/documents'");
const hasApplicationsRoute = serverContent.includes("app.get('/api/user/probate-applications'");

console.log("Route Definition in File:");
console.log("- Document Upload Route exists:", hasRoute);
console.log("- User Applications Route exists:", hasApplicationsRoute);
