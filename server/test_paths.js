const path = require('path');
const __dirname_sim = 'C:\\laragon\\www\\crms\\server';
const profile_pic = '/uploads/profiles/pic.jpg';
console.log('Joined:', path.join(__dirname_sim, profile_pic));
console.log('Normalized Joined:', path.join(__dirname_sim, profile_pic.startsWith('/') ? profile_pic.substring(1) : profile_pic));
